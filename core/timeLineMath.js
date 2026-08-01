export const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
export const MILLISECONDS_IN_HOUR = 60 * 60 * 1000;
export const SECONDS_IN_DAY = 24 * 60 * 60;

export function addPercentShift(percent, number) {
  return number + (number * percent) / 100;
}

export function calculateFontSize(totalAvailableHeight, numberOfElements = 2) {
  const lineHeightEstimateMultiplier = 1.2;
  const adjustedHeight =
    totalAvailableHeight / (numberOfElements * lineHeightEstimateMultiplier);

  return adjustedHeight;
}

export function calculateTopOffset(
  totalHeight,
  positionHeight,
  numberOfElements = 2,
) {
  const center = totalHeight / 2;
  const offset = positionHeight - center;

  const lineHeightEstimateMultiplier = 1.2;
  const adjustedItemHeight =
    totalHeight / (numberOfElements * lineHeightEstimateMultiplier);
  const halfItemAdjustedHeight = adjustedItemHeight / 2;

  if (numberOfElements === 2) {
    return [offset, -adjustedItemHeight + offset];
  }

  return Array.from({ length: numberOfElements }, (_, i) => {
    return halfItemAdjustedHeight + offset - i * adjustedItemHeight;
  });
}

export function getBoundaryPositions(position, width, isLeftSide) {
  if (isLeftSide) {
    return { start: position - width, end: position, width };
  }
  return { start: position, end: position + width, width };
}

export function formatDeltaToLocal(deltaSeconds) {
  if (deltaSeconds == null || Number.isNaN(deltaSeconds)) {
    return null;
  }
  if (deltaSeconds === 0) {
    return "0h";
  }

  // Offsets are typically multiples of 15 minutes; round defensively to avoid
  // float noise.
  const deltaMinutes = Math.round(deltaSeconds / 60);
  const sign = deltaMinutes > 0 ? "+" : "-";
  const absMinutes = Math.abs(deltaMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;

  const value =
    hours === 0 && minutes > 0
      ? `${sign}${minutes}m`
      : `${sign}${hours}h${minutes ? `${minutes}m` : ""}`;

  return value;
}

export function getTimeZoneOffsetSecondsSafe(timeZone, date) {
  if (!timeZone) return null;
  const d = date ?? new Date();

  const tryGet = (timeZoneNameStyle) => {
    const formatterOffset = new Intl.DateTimeFormat("en-US", {
      hourCycle: "h23",
      timeZoneName: timeZoneNameStyle,
      timeZone,
    });
    const part = formatterOffset
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName");
    const value = part?.value ?? "";
    if (value === "GMT" || value === "UTC") return 0;

    // Examples: "GMT+07:00", "UTC-05:00"
    const match = value.match(/(?:GMT|UTC)([+-]\d{2}):(\d{2})/);
    if (!match) return null;
    const offsetHours = parseInt(match[1], 10);
    const offsetMinutes = parseInt(match[2], 10);
    return offsetHours * 3600 + offsetMinutes * 60;
  };

  try {
    // Prefer longOffset when supported (more consistent).
    return tryGet("longOffset");
  } catch (e) {
    // Some environments don't support longOffset; try shortOffset.
    try {
      return tryGet("shortOffset");
    } catch (e2) {
      return null;
    }
  }
}

export function getZonedYMD(timeZone, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

export function getStartOfZonedDayUtcMs(timeZone, date = new Date()) {
  const { year, month, day } = getZonedYMD(timeZone, date);
  const baseUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  // Two-pass correction helps around DST boundaries.
  let guess = new Date(baseUtcMs);
  for (let i = 0; i < 2; i += 1) {
    const offsetSeconds = getTimeZoneOffsetSecondsSafe(timeZone, guess) ?? 0;
    guess = new Date(baseUtcMs - offsetSeconds * 1000);
  }

  return guess.getTime();
}

/**
 * The view offset in hours of the day boundary adjacent to the current
 * window start — used by the ‹ › controls to re-align a freely scrolled
 * window to real (DST-correct) home-zone day starts. Going backwards from a
 * mid-day position first aligns to the start of the day being viewed.
 */
export function getAdjacentDayStartOffsetHours(
  timeZone,
  nowDate,
  offsetHours,
  direction,
) {
  const todayStartMs = getStartOfZonedDayUtcMs(timeZone, nowDate);
  const windowStartMs = todayStartMs + offsetHours * MILLISECONDS_IN_HOUR;
  const viewedDayStartMs = getStartOfZonedDayUtcMs(
    timeZone,
    new Date(windowStartMs),
  );

  let targetMs;
  if (direction > 0) {
    // Aim well past the current day's end; snapping lands on the next start.
    targetMs = getStartOfZonedDayUtcMs(
      timeZone,
      new Date(viewedDayStartMs + 36 * MILLISECONDS_IN_HOUR),
    );
  } else if (windowStartMs > viewedDayStartMs) {
    targetMs = viewedDayStartMs;
  } else {
    targetMs = getStartOfZonedDayUtcMs(
      timeZone,
      new Date(viewedDayStartMs - 12 * MILLISECONDS_IN_HOUR),
    );
  }

  return (targetMs - todayStartMs) / MILLISECONDS_IN_HOUR;
}

// "+3h", "-5h", "+1d", "-1d 4h" — compact label for a view offset in hours.
export function formatHourOffsetLabel(offsetHours) {
  if (!offsetHours) {
    return "0h";
  }
  const sign = offsetHours > 0 ? "+" : "-";
  const absHours = Math.abs(offsetHours);
  const days = Math.floor(absHours / 24);
  const hours = absHours - days * 24;

  if (days === 0) {
    return `${sign}${hours}h`;
  }
  return `${sign}${days}d${hours ? ` ${hours}h` : ""}`;
}

// `viewOffsetSeconds` shifts the strip's origin: with a freely scrolled
// window the left edge is `viewOffsetSeconds` into the home day, and a
// time-of-day earlier than that appears on the next calendar day — a single
// wrap keeps every time-of-day at exactly one position on the strip.
export function getXPosFromDayOffset(
  secondsOffsetFromDay,
  size,
  viewOffsetSeconds = 0,
) {
  if (secondsOffsetFromDay == null) {
    return null;
  }

  let relativeSeconds = secondsOffsetFromDay - viewOffsetSeconds;
  if (relativeSeconds < 0) {
    relativeSeconds += SECONDS_IN_DAY;
  }

  const proportionOfDay = relativeSeconds / SECONDS_IN_DAY;
  const position = proportionOfDay * size.hoursLineWidth;
  return position + size.leftOffset + size.leftListOffset;
}

export function getSecondsFromStartOfDay(xPos, size, viewOffsetSeconds = 0) {
  const adjustedPosition = xPos - (size.leftListOffset ?? 0) - size.leftOffset;
  const proportionOfTimeline = adjustedPosition / size.hoursLineWidth;
  const seconds =
    (proportionOfTimeline * MILLISECONDS_IN_DAY) / 1000 + viewOffsetSeconds;
  // Day-aligned views keep the legacy 0..86400 inclusive range (a flush-right
  // endpoint is "end of day", not "start of day"); shifted windows wrap.
  if (viewOffsetSeconds > 0 && seconds >= SECONDS_IN_DAY) {
    return seconds - SECONDS_IN_DAY;
  }
  return seconds;
}

// Compact duration like "1h 30m": the two largest non-zero units of h/m/s.
export function formatDurationShort(seconds) {
  if (!seconds) {
    return "";
  }
  const units = [
    ["h", Math.floor(seconds / 3600)],
    ["m", Math.floor((seconds % 3600) / 60)],
    ["s", Math.round(seconds % 60)],
  ];
  return units
    .filter(([, value]) => value > 0)
    .slice(0, 2)
    .map(([label, value]) => `${value}${label}`)
    .join(" ");
}

export function calculateDurationData({
  xPos1,
  xPos2,
  hoursLineWidth,
  formatDuration = formatDurationShort,
  // On a scrolled window a seam-straddling interval renders its endpoints in
  // swapped pixel order, so the pixel span is the day-complement of the real
  // range — callers that know the endpoint times pass the true duration here.
  durationSeconds: durationSecondsOverride,
}) {
  const isIntervalHasBothPoints = xPos1 !== null && xPos2 !== null;
  if (isIntervalHasBothPoints) {
    const startPosition = Math.min(xPos1, xPos2);
    const endPosition = Math.max(xPos1, xPos2);
    let durationPixels = Math.abs(endPosition - startPosition);
    let durationSeconds = Math.round(
      ((durationPixels / hoursLineWidth) * MILLISECONDS_IN_DAY) / 1000,
    );
    if (durationSecondsOverride != null) {
      durationSeconds = Math.round(durationSecondsOverride);
      durationPixels =
        ((durationSeconds * 1000) / MILLISECONDS_IN_DAY) * hoursLineWidth;
    }

    const durationHuman = formatDuration(durationSeconds);
    const arrowMidPoint = (startPosition + endPosition) / 2;

    return {
      durationPixels,
      durationSeconds,
      durationHuman,
      arrowMidPoint,
    };
  }
  return {};
}
