import { useCallback, useEffect, useRef } from "react";

export default function useTimeIntervalDrag({
  tzState,
  tzDispatch,
  timeIntervals,
  size,
  formatDuration,
  secondsInDay,
  collider,
  colliderState,
  applyCollisionResolution,
  calculateSecondsFromStartOfDay,
  calculatePositionFromDayOffset,
  calculateDurationData,
  updateTimeInterval,
}) {
  const capturedTimeIntervalIdRef = useRef(null);
  const intervalMoveStartXRef = useRef(null);

  const isCtrlOrCmdPressedRef = useRef(false);
  const isShiftPressedRef = useRef(false);

  const rafScheduledRef = useRef(false);
  const lastMouseEventRef = useRef(null);

  useEffect(() => {
    // Keep an id of an active (non-fixed) interval if any, but without forcing rerenders.
    capturedTimeIntervalIdRef.current =
      timeIntervals.find((tp) => tp.mode !== "fixed")?.id ?? null;
  }, [timeIntervals]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        isCtrlOrCmdPressedRef.current = true;
      }
      if (event.key === "Shift") {
        isShiftPressedRef.current = true;
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Control" || event.key === "Meta") {
        isCtrlOrCmdPressedRef.current = false;
      }
      if (event.key === "Shift") {
        isShiftPressedRef.current = false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleDragStartTimePoint = useCallback(
    (ev, id, mode, actionPoint) => {
      ev.preventDefault();
      ev.stopPropagation();

      capturedTimeIntervalIdRef.current = id;
      intervalMoveStartXRef.current = ev.clientX;

      tzDispatch(
        updateTimeInterval({
          id,
          mode,
          actionPoint,
        }),
      );
    },
    [tzDispatch, updateTimeInterval],
  );

  const handleMouseMoveInternal = useCallback(
    (ev) => {
      const capturedId = capturedTimeIntervalIdRef.current;
      if (capturedId == null) {
        return;
      }

      const capturedTimeInterval = tzState.timeIntervalsMap[capturedId];

      const isTimeIntervalReadyForAction =
        capturedTimeInterval &&
        size.hoursLineWidth &&
        size.timeIntervalClockWidth &&
        ["float", "resize", "move"].includes(capturedTimeInterval?.mode);

      if (!isTimeIntervalReadyForAction) {
        return;
      }

      const validateXPosBoundary = (pos) => {
        const leftBoundary = size.leftOffset + size.leftListOffset;
        const rightBoundary =
          size.hoursLineWidth + size.leftOffset + size.leftListOffset;
        if (pos < leftBoundary) {
          return [leftBoundary, true];
        }
        if (pos > rightBoundary) {
          return [rightBoundary, true];
        }
        return [pos, false];
      };

      if (capturedTimeInterval.mode === "move") {
        const moveStartX = intervalMoveStartXRef.current;
        if (moveStartX == null) {
          intervalMoveStartXRef.current = ev.clientX;
          return;
        }

        const currentRange = (
          capturedTimeInterval.xPos2 - capturedTimeInterval.xPos1
        ).toFixed(2);
        const moveOffset = ev.clientX - moveStartX;

        const [newXPos1, isBoundaryPos1] = validateXPosBoundary(
          capturedTimeInterval.xPos1 + moveOffset,
        );
        const [newXPos2, isBoundaryPos2] = isBoundaryPos1
          ? [capturedTimeInterval.xPos2, false]
          : validateXPosBoundary(capturedTimeInterval.xPos2 + moveOffset);

        const xPos1 = isBoundaryPos2 ? capturedTimeInterval.xPos1 : newXPos1;
        const xPos2 = isBoundaryPos1 ? capturedTimeInterval.xPos2 : newXPos2;
        const newRange = (xPos2 - xPos1).toFixed(2);

        if (newRange !== currentRange) {
          return;
        }

        const capturedIntervalDispatchData = {
          ...capturedTimeInterval,
          xPos1,
          xPos2,
          xPos1DayOffsetSeconds: calculateSecondsFromStartOfDay(xPos1),
          xPos2DayOffsetSeconds: calculateSecondsFromStartOfDay(xPos2),
          ...calculateDurationData({
            xPos1,
            xPos2,
            hoursLineWidth: size.hoursLineWidth,
            formatDuration,
          }),
        };
        const fixed = collider({
          timeInterval: {
            ...capturedIntervalDispatchData,
            xPos1,
            xPos2,
          },
          timeZonesClock: colliderState.timeZonesClock,
          timeLineName: colliderState.timeLineName,
        });
        applyCollisionResolution(fixed, {
          ...capturedIntervalDispatchData,
          xPos1,
          xPos2,
        });

        intervalMoveStartXRef.current = ev.clientX;
      } else {
        const { actionPoint } = capturedTimeInterval;

        let [newXPos] = validateXPosBoundary(ev.clientX);
        const offsetSeconds = calculateSecondsFromStartOfDay(newXPos);

        let stepSeconds = isCtrlOrCmdPressedRef.current
          ? 1
          : tzState.intervalStepSeconds;
        if (isShiftPressedRef.current) {
          stepSeconds = 5 * 60;
        }

        const snappedOffsetSeconds =
          Math.round(offsetSeconds / stepSeconds) * stepSeconds;
        newXPos = calculatePositionFromDayOffset(snappedOffsetSeconds);

        const capturedIntervalDispatchData = {
          ...capturedTimeInterval,
          [actionPoint]: newXPos,
          [`${actionPoint}DayOffsetSeconds`]:
            calculateSecondsFromStartOfDay(newXPos),
          ...calculateDurationData({
            xPos1: capturedTimeInterval.xPos1,
            xPos2: capturedTimeInterval.xPos2,
            hoursLineWidth: size.hoursLineWidth,
            formatDuration,
          }),
        };

        const fixed = collider({
          timeInterval: capturedIntervalDispatchData,
          timeZonesClock: colliderState.timeZonesClock,
          timeLineName: colliderState.timeLineName,
        });
        applyCollisionResolution(fixed, capturedIntervalDispatchData);
      }
    },
    [
      tzState,
      tzDispatch,
      size,
      formatDuration,
      collider,
      colliderState,
      applyCollisionResolution,
      calculateSecondsFromStartOfDay,
      calculatePositionFromDayOffset,
      calculateDurationData,
    ],
  );

  const handleMouseMove = useCallback(
    (ev) => {
      lastMouseEventRef.current = ev;
      if (rafScheduledRef.current) return;

      rafScheduledRef.current = true;
      requestAnimationFrame(() => {
        rafScheduledRef.current = false;
        const lastEv = lastMouseEventRef.current;
        if (lastEv) {
          handleMouseMoveInternal(lastEv);
        }
      });
    },
    [handleMouseMoveInternal],
  );

  const handleMouseUp = useCallback(() => {
    const capturedId = capturedTimeIntervalIdRef.current;
    if (capturedId == null) {
      return;
    }

    const capturedTimeInterval = tzState.timeIntervalsMap[capturedId];
    if (["resize", "move", "float"].includes(capturedTimeInterval?.mode)) {
      let updatedInterval = { id: capturedId, mode: "fixed" };

      if (!capturedTimeInterval.xPos2) {
        const twoHoursInSeconds = 2 * 60 * 60;

        const xPos1DayOffsetSeconds = calculateSecondsFromStartOfDay(
          capturedTimeInterval.xPos1,
        );
        let xPos2DayOffsetSeconds = xPos1DayOffsetSeconds + twoHoursInSeconds;

        if (xPos2DayOffsetSeconds > secondsInDay) {
          xPos2DayOffsetSeconds -= twoHoursInSeconds * 2;
        }
        updatedInterval.xPos2DayOffsetSeconds = xPos2DayOffsetSeconds;

        updatedInterval.xPos2 = calculatePositionFromDayOffset(
          updatedInterval.xPos2DayOffsetSeconds,
        );
        updatedInterval = {
          ...updatedInterval,
          ...calculateDurationData({
            xPos1: capturedTimeInterval.xPos1,
            xPos2: updatedInterval.xPos2,
            hoursLineWidth: size.hoursLineWidth,
            formatDuration,
          }),
        };
      }
      tzDispatch(updateTimeInterval(updatedInterval));
    }
  }, [
    tzState,
    tzDispatch,
    size.hoursLineWidth,
    formatDuration,
    secondsInDay,
    calculateSecondsFromStartOfDay,
    calculatePositionFromDayOffset,
    calculateDurationData,
    updateTimeInterval,
  ]);

  return {
    handleMouseMove,
    handleMouseUp,
    handleDragStartTimePoint,
  };
}
