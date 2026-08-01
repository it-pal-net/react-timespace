const MINUTES_IN_DAY = 24 * 60;
const SAMPLE_MINUTES = 1;
const zonedPartsFormatters = new Map();

function parseTime(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function normalizeAvailability(availability) {
  if (!availability) return [];
  const input = Array.isArray(availability) ? availability : [availability];

  return input
    .map((range) => {
      const start = parseTime(range?.start);
      const end = parseTime(range?.end);
      return start == null || end == null ? null : { start, end };
    })
    .filter(Boolean);
}

export function isMinuteAvailable(ranges, minuteOfDay) {
  return ranges.some(({ start, end }) => {
    if (start === end) return true;
    if (start < end) return minuteOfDay >= start && minuteOfDay < end;
    return minuteOfDay >= start || minuteOfDay < end;
  });
}

function getZonedParts(timeZone, date) {
  let formatter = zonedPartsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    zonedPartsFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(date);
  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );
}

function getOffsetMs(timeZone, date) {
  const p = getZonedParts(timeZone, date);
  const zonedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return zonedAsUtc - Math.floor(date.getTime() / 60000) * 60000;
}

function getStartOfZonedDayUtcMs(timeZone, date) {
  const p = getZonedParts(timeZone, date);
  const midnightAsUtc = Date.UTC(p.year, p.month - 1, p.day);
  let result = midnightAsUtc;
  // Two passes cover offset changes around daylight-saving boundaries.
  for (let i = 0; i < 2; i += 1) {
    result = midnightAsUtc - getOffsetMs(timeZone, new Date(result));
  }
  return result;
}

function samplesToSegments(samples) {
  const segments = [];
  let start = null;
  samples.forEach((active, index) => {
    if (active && start == null) start = index;
    if (!active && start != null) {
      segments.push({
        start: start / samples.length,
        end: index / samples.length,
      });
      start = null;
    }
  });
  if (start != null) segments.push({ start: start / samples.length, end: 1 });
  return segments;
}

/**
 * Maps local availability windows onto the 24h window shown by Timespace.
 * The returned object is keyed by timeline id and contains 24 cells. Each cell
 * has row availability segments and common-overlap segments (0..1 fractions).
 * The window defaults to `date`'s home-zone day; a freely scrolled view passes
 * its exact start via `windowStartUtcMs`.
 */
export function calculateAvailabilityGrid(
  timeLines,
  homeZone,
  date = new Date(),
  windowStartUtcMs = null,
) {
  const configured = timeLines
    .map((line) => ({ line, ranges: normalizeAvailability(line.availability) }))
    .filter(({ ranges }) => ranges.length > 0);
  if (configured.length === 0) return {};

  const homeStart = windowStartUtcMs ?? getStartOfZonedDayUtcMs(homeZone, date);
  const samplesPerHour = 60 / SAMPLE_MINUTES;
  const sampleCount = 24 * samplesPerHour;
  const samplesById = {};

  configured.forEach(({ line, ranges }) => {
    samplesById[line.id] = Array.from({ length: sampleCount }, (_, index) => {
      const instant = new Date(
        homeStart + (index * SAMPLE_MINUTES + SAMPLE_MINUTES / 2) * 60000,
      );
      const p = getZonedParts(line.timeZone, instant);
      return isMinuteAvailable(ranges, p.hour * 60 + p.minute);
    });
  });

  const hasCommonOverlap = configured.length >= 2;
  const common = Array.from({ length: sampleCount }, (_, index) =>
    hasCommonOverlap
      ? configured.every(({ line }) => samplesById[line.id][index])
      : false,
  );

  return Object.fromEntries(
    configured.map(({ line }) => [
      line.id,
      Array.from({ length: 24 }, (_, hour) => {
        const start = hour * samplesPerHour;
        const end = start + samplesPerHour;
        return {
          available: samplesToSegments(samplesById[line.id].slice(start, end)),
          overlap: samplesToSegments(common.slice(start, end)),
        };
      }),
    ]),
  );
}
