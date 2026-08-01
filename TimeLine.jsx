import { memo, useMemo } from "react";
import PropTypes from "prop-types";

import * as S from "./styled";
import {
  getZonedYMD,
  getStartOfZonedDayUtcMs,
  MILLISECONDS_IN_HOUR,
} from "./core/timeLineMath";

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

const TimeLine = ({
  timeZone,
  homeZone,
  color,
  hourMaxWidth,
  isEmpty,
  hoursElRef,
  timer,
  availabilityCells,
  viewStartUtcMs,
  isPanning,
}) => {
  const isHomeRow = timeZone === homeZone;

  const nowMs = (timer ?? null) != null ? timer * 1000 : Date.now();
  const nowDate = useMemo(() => new Date(nowMs), [nowMs]);

  const homeDayKey = useMemo(() => {
    const { year, month, day } = getZonedYMD(homeZone, nowDate);
    // A stable, low-cost dependency so we only recompute day boundaries when the day changes.
    return `${year}-${month}-${day}`;
  }, [homeZone, nowDate]);

  const homeTodayStartUtcMs = useMemo(() => {
    return getStartOfZonedDayUtcMs(homeZone, nowDate);
  }, [homeZone, homeDayKey, nowDate]);

  // Timespace passes the viewed window's start (day paging / drag panning);
  // standalone rows without it fall back to "today in the home zone".
  const windowStartUtcMs = viewStartUtcMs ?? homeTodayStartUtcMs;

  const cellMeta = useMemo(() => {
    // Each column corresponds to one home-zone hour boundary of the viewed
    // window. Formatting that exact instant in the row's timezone yields the
    // hour label, weekday/weekend and "day start" markers (00:00 in that
    // timezone) — correct even across DST transitions inside the window.
    const cellFmt = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    });

    return Array.from({ length: 24 }, (_, idx) => {
      const boundaryInstant = new Date(
        windowStartUtcMs + idx * MILLISECONDS_IN_HOUR,
      );
      let hour = 0;
      let weekdayShort = "";
      for (const part of cellFmt.formatToParts(boundaryInstant)) {
        if (part.type === "hour") hour = Number(part.value);
        else if (part.type === "weekday") weekdayShort = part.value;
      }

      return {
        hour,
        isWeekend: isWeekendByWeekdayShort(weekdayShort),
        weekdayShort,
        isDayStart: hour === 0,
      };
    });
  }, [windowStartUtcMs, timeZone]);

  // Past/now/future are *global* across rows (anchored to the home-zone "now"
  // column) so the semantic split aligns with the vertical "now" line. Outside
  // the viewed window the index goes below 0 (future day: nothing past) or
  // above 23 (past day: everything past).
  const homeNowIndex = Math.floor(
    (nowMs - windowStartUtcMs) / MILLISECONDS_IN_HOUR,
  );

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
        {cellMeta.map(({ hour, isWeekend, weekdayShort, isDayStart }, idx) => {
          const isNowCol = idx === homeNowIndex;
          const availabilityOpacityStyle = {
            // Availability bands are computed for the committed day page; while
            // the strip is being panned by hours they would sit on the wrong
            // columns, so fade them out for the duration of the gesture.
            opacity: isPanning ? 0 : 1,
            transition: "opacity 160ms ease",
          };
          return (
            <S.Hour
              key={`${idx}-${hour}`}
              isEmpty={isEmpty}
              maxWidth={hourMaxWidth}
              period={getHourPeriod(hour)}
              isQuietHour={hour < 7 || hour > 22}
              isWeekend={isWeekend}
              isDayStart={isDayStart}
              isPast={idx < homeNowIndex}
              isNowCol={isNowCol}
              isHomeNowCell={isHomeRow && isNowCol}
              data-timeline-home-now-hour={
                isHomeRow && isNowCol ? "1" : undefined
              }
              title={
                availabilityCells?.[idx]?.overlap?.length
                  ? "Availability overlaps across time zones"
                  : availabilityCells?.[idx]?.available?.length
                    ? "Available"
                    : !isEmpty && isDayStart
                      ? weekdayShort
                      : undefined
              }
              style={{
                ...(isEmpty ? { height: 0 } : {}),
                ...(color ? { color } : {}),
              }}
            >
              {availabilityCells?.[idx]?.available?.map(
                (segment, segmentIndex) => (
                  <S.AvailabilityLayer
                    key={`available-${segmentIndex}`}
                    aria-hidden="true"
                    style={{
                      left: `${segment.start * 100}%`,
                      right: `${(1 - segment.end) * 100}%`,
                      ...availabilityOpacityStyle,
                    }}
                  />
                ),
              )}
              {availabilityCells?.[idx]?.overlap?.map(
                (segment, segmentIndex) => (
                  <S.AvailabilityOverlapLayer
                    key={`overlap-${segmentIndex}`}
                    aria-hidden="true"
                    style={{
                      left: `${segment.start * 100}%`,
                      right: `${(1 - segment.end) * 100}%`,
                      ...availabilityOpacityStyle,
                    }}
                  />
                ),
              )}
              {!isEmpty && <span className="hour-label">{hour}</span>}
            </S.Hour>
          );
        })}
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
    // `current` stays untyped on purpose: naming the DOM `Element` global here
    // is evaluated at import time and would throw when the package is loaded
    // on a server (SSR / Next.js), where no DOM exists.
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  color: PropTypes.string,
  // Optional clock tick (epoch seconds) used to keep styling in sync over time.
  timer: PropTypes.number,
  availabilityCells: PropTypes.array,
  // UTC ms of the viewed window's first column (defaults to today's start in
  // the home zone). Day paging / drag panning shift it in whole hours.
  viewStartUtcMs: PropTypes.number,
  isPanning: PropTypes.bool,
};

// Memoized: interval drags dispatch context updates every frame, and the 24
// styled Hour cells per row are the most expensive part of a row render. All
// props here are stable during a drag (timer only ticks once per second).
export default memo(TimeLine);
