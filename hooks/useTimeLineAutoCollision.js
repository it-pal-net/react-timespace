import { useEffect } from "react";

export default function useTimeLineAutoCollision({
  homeDayPassedXPos,
  size,
  timeIntervals,
  colliderState,
  setColliderState,
  calculatePositionFromDayOffset,
  calculateDurationData,
  formatDuration,
  collider,
  applyCollisionResolution,
  colliderTrigger,
}) {
  useEffect(() => {
    const side =
      // `homeDayPassedXPos` is already in viewport coordinates (includes `leftListOffset`)
      homeDayPassedXPos >
      size.maxHeaderWidth + size.leftOffset + size.leftListOffset
        ? "left"
        : "right";

    setColliderState((s) => {
      if (s.timeLineName.side === side) {
        return s;
      }
      return {
        ...s,
        timeLineName: {
          ...s.timeLineName,
          side,
        },
      };
    });

    const recalcIntervalsXPosFromDayOffset = (timeInterval) => {
      const xPos1 = timeInterval.xPos1DayOffsetSeconds
        ? calculatePositionFromDayOffset(timeInterval.xPos1DayOffsetSeconds)
        : timeInterval.xPos1;
      const xPos2 = timeInterval.xPos2DayOffsetSeconds
        ? calculatePositionFromDayOffset(timeInterval.xPos2DayOffsetSeconds)
        : timeInterval.xPos2;

      return {
        ...timeInterval,
        xPos1,
        xPos2,
        ...calculateDurationData({
          xPos1,
          xPos2,
          hoursLineWidth: size.hoursLineWidth,
          formatDuration,
        }),
      };
    };

    const timeInterval = timeIntervals.length
      ? recalcIntervalsXPosFromDayOffset(timeIntervals[0])
      : null;

    const fixed = collider({
      timeInterval,
      timeZonesClock: colliderState.timeZonesClock,
      timeLineName: {
        ...colliderState.timeLineName,
        side,
      },
    });
    applyCollisionResolution(fixed, timeInterval);
  }, [
    size.maxHeaderWidth,
    size.timeZonesClockWidth,
    size.hoursLineWidth,
    colliderTrigger,
    timeIntervals.length,
  ]);
}
