export const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
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

export function getXPosFromDayOffset(secondsOffsetFromDay, size) {
  if (secondsOffsetFromDay == null) {
    return null;
  }

  const proportionOfDay = secondsOffsetFromDay / SECONDS_IN_DAY;
  const position = proportionOfDay * size.hoursLineWidth;
  return position + size.leftOffset + size.leftListOffset;
}

export function getSecondsFromStartOfDay(xPos, size) {
  const adjustedPosition = xPos - (size.leftListOffset ?? 0) - size.leftOffset;
  const proportionOfTimeline = adjustedPosition / size.hoursLineWidth;
  return (proportionOfTimeline * MILLISECONDS_IN_DAY) / 1000;
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
}) {
  const isIntervalHasBothPoints = xPos1 !== null && xPos2 !== null;
  if (isIntervalHasBothPoints) {
    const startPosition = Math.min(xPos1, xPos2);
    const endPosition = Math.max(xPos1, xPos2);
    const durationPixels = Math.abs(endPosition - startPosition);
    const durationSeconds = Math.round(
      ((durationPixels / hoursLineWidth) * MILLISECONDS_IN_DAY) / 1000,
    );

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
