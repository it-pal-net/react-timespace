import { useMemo } from "react";
import PropTypes from "prop-types";

import * as S from "./styled";

function getTimeZoneOffsetSecondsSafe(timeZone, date) {
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

function getZonedYMD(timeZone, date = new Date()) {
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

  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);

  return { year, month, day };
}

function getStartOfZonedDayUtcMs(timeZone, date = new Date()) {
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

function isWeekendByWeekdayShort(weekdayShort) {
  return weekdayShort === "Sat" || weekdayShort === "Sun";
}

function getHourPeriod(hour) {
  // Night: 22–07 local (hour 22,23,0..6 are "night"; 7 is "morning shoulder")
  if (hour >= 22 || hour <= 6) return "night";
  if (hour === 7) return "morning";
  // Day: 08–18 local
  if (hour >= 8 && hour <= 18) return "day";
  // Evening shoulder: 19–21 local
  return "evening";
}

function getHoursLine({ timeZone, homeZone }) {
  const hoursInDay = 24;
  const hoursArray = Array.from({ length: hoursInDay }, (_, i) => i);

  // Get the current date and time in the home timezone
  const options = { timeZone: homeZone, hour: "numeric", hour12: false };
  const homeTimeRaw = new Intl.DateTimeFormat("en-US", options).format(
    new Date(),
  );

  let homeTime = parseInt(homeTimeRaw, 10);
  homeTime = (homeTime + hoursInDay) % hoursInDay;

  // Calculate the time difference between the homezone and the target timezone
  const targetTime = new Date().toLocaleString("en-US", { timeZone });
  const targetHour = new Date(targetTime).getHours();
  let timeDifference = targetHour - homeTime;

  // Adjust for date line crossing
  if (timeDifference < -12) {
    timeDifference += 24;
  } else if (timeDifference > 12) {
    timeDifference -= 24;
  }

  // Generate the array of hours in the target timezone using map
  const resultHours = hoursArray.map((hour) => {
    const hourInTargetZone = Number(
      ((hour + timeDifference) % 24).toFixed(0),
      10,
    );
    return hourInTargetZone < 0 ? hourInTargetZone + 24 : hourInTargetZone;
  });

  return resultHours;
}

const TimeLine = ({
  timeZone,
  homeZone,
  color,
  hourMaxWidth,
  isEmpty,
  hoursElRef,
  timer,
}) => {
  const isHomeRow = timeZone === homeZone;
  const hours = useMemo(() => {
    return getHoursLine({ timeZone, homeZone });
  }, [timeZone, homeZone]);

  const nowMs = (timer ?? null) != null ? timer * 1000 : Date.now();
  const nowDate = useMemo(() => new Date(nowMs), [nowMs]);

  const homeDayKey = useMemo(() => {
    const { year, month, day } = getZonedYMD(homeZone, nowDate);
    // A stable, low-cost dependency so we only recompute day boundaries when the day changes.
    return `${year}-${month}-${day}`;
  }, [homeZone, nowDate]);

  const homeStartUtcMs = useMemo(() => {
    return getStartOfZonedDayUtcMs(homeZone, nowDate);
  }, [homeZone, homeDayKey, nowDate]);

  const cellMeta = useMemo(() => {
    // Each column corresponds to a specific home-zone hour boundary within "today"
    // (home zone). We can translate that instant into the row's timezone to derive
    // weekday/weekend + "day start" markers (00:00 in that timezone).
    const weekdayFmt = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone,
    });

    const homeNowIndexRaw = Math.floor(
      (nowMs - homeStartUtcMs) / (60 * 60 * 1000),
    );
    const homeNowIndex = Math.max(0, Math.min(23, homeNowIndexRaw));

    return hours.map((hour, idx) => {
      const boundaryInstant = new Date(homeStartUtcMs + idx * 60 * 60 * 1000);
      const weekdayShort = weekdayFmt.format(boundaryInstant);

      return {
        isWeekend: isWeekendByWeekdayShort(weekdayShort),
        weekdayShort,
        isDayStart: hour === 0,
        // Past/now/future should be *global* across rows (anchored to home-zone "now" column),
        // so the semantic split aligns with the vertical "now" line.
        isPast: idx < homeNowIndex,
        isNowCol: idx === homeNowIndex,
      };
    });
  }, [hours, homeStartUtcMs, timeZone, nowMs]);

  return (
    <S.TimeLine
      className="timeline"
      style={{
        ...(isEmpty ? { height: 0 } : {}),
        ...(color ? { "--border": color } : {}),
      }}
    >
      <S.Hours
        ref={hoursElRef}
        style={{
          ...(isEmpty ? { height: 0 } : {}),
        }}
      >
        {hours.map((hour, idx) => (
          <S.Hour
            key={`${idx}-${hour}`}
            isEmpty={isEmpty}
            maxWidth={hourMaxWidth}
            period={getHourPeriod(hour)}
            isQuietHour={hour < 7 || hour > 22}
            isWeekend={cellMeta[idx]?.isWeekend}
            isDayStart={cellMeta[idx]?.isDayStart}
            isPast={cellMeta[idx]?.isPast}
            isNowCol={cellMeta[idx]?.isNowCol}
            isHomeNowCell={isHomeRow && cellMeta[idx]?.isNowCol}
            data-timeline-home-now-hour={
              isHomeRow && cellMeta[idx]?.isNowCol ? "1" : undefined
            }
            title={
              !isEmpty && cellMeta[idx]?.isDayStart
                ? cellMeta[idx]?.weekdayShort
                : undefined
            }
            style={{
              ...(isEmpty ? { height: 0 } : {}),
              ...(color ? { color } : {}),
            }}
          >
            {!isEmpty && <span className="hour-label">{hour}</span>}
          </S.Hour>
        ))}
      </S.Hours>
    </S.TimeLine>
  );
};

TimeLine.propTypes = {
  timeZone: PropTypes.string.isRequired,
  homeZone: PropTypes.string.isRequired,
  hourMaxWidth: PropTypes.number.isRequired,
  isEmpty: PropTypes.bool,
  hoursElRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  color: PropTypes.string,
  // Optional clock tick (epoch seconds) used to keep styling in sync over time.
  timer: PropTypes.number,
};

export default TimeLine;
