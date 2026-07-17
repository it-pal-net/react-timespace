import { useCallback, useEffect, useRef } from "react";

// Dragging the only point of an interval creates/resizes its second point;
// otherwise each handle resizes itself.
export const getResizeTargetPosKey = (timeInterval, posKey) =>
  timeInterval.xPos2 == null ? "xPos2" : posKey;

/**
 * Interval drag interaction.
 *
 * Explicit drags (resize a hand / move the whole range) start from a
 * `pointerdown` on a grab surface and are tracked with window-level
 * pointermove/pointerup listeners, so the drag keeps working when the cursor
 * leaves the timeline list and the drop is never missed. Escape cancels an
 * active drag and restores the positions captured at drag start.
 *
 * A freshly added interval (mode "float") has no pointer capture: it follows
 * the cursor via the container's pointermove and is placed on pointerup.
 */
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
  // Latest render values, readable from the stable window-level handlers.
  const latestRef = useRef(null);
  latestRef.current = {
    tzState,
    size,
    formatDuration,
    collider,
    colliderState,
    applyCollisionResolution,
    calculateSecondsFromStartOfDay,
    calculatePositionFromDayOffset,
    calculateDurationData,
  };

  const capturedTimeIntervalIdRef = useRef(null);
  // Active pointer-drag session (null while idle / float-follow).
  const dragRef = useRef(null);
  const teardownRef = useRef(null);
  const rafRef = useRef(null);
  const lastPointerRef = useRef(null);

  useEffect(() => {
    // Keep an id of an active (non-fixed) interval if any, but without forcing rerenders.
    capturedTimeIntervalIdRef.current =
      timeIntervals.find((ti) => ti.mode !== "fixed")?.id ?? null;
  }, [timeIntervals]);

  const applyPointer = useCallback((pointer) => {
    const {
      tzState: state,
      size: sizes,
      formatDuration: formatDurationFn,
      collider: colliderFn,
      colliderState: colliderStateValue,
      applyCollisionResolution: applyResolution,
      calculateSecondsFromStartOfDay: toSeconds,
      calculatePositionFromDayOffset: toXPos,
      calculateDurationData: toDurationData,
    } = latestRef.current;

    const capturedId = capturedTimeIntervalIdRef.current;
    if (capturedId == null) {
      return;
    }

    const capturedTimeInterval = state.timeIntervalsMap[capturedId];
    const isTimeIntervalReadyForAction =
      capturedTimeInterval &&
      sizes.hoursLineWidth &&
      sizes.timeIntervalClockWidth &&
      ["float", "resize", "move"].includes(capturedTimeInterval.mode);
    if (!isTimeIntervalReadyForAction) {
      return;
    }

    const leftBoundary = sizes.leftOffset + sizes.leftListOffset;
    const rightBoundary = sizes.hoursLineWidth + leftBoundary;

    let stepSeconds = pointer.fineStep ? 1 : state.intervalStepSeconds;
    if (pointer.coarseStep) {
      stepSeconds = 5 * 60;
    }
    const snapXPos = (xPos) => {
      const snappedSeconds =
        Math.round(toSeconds(xPos) / stepSeconds) * stepSeconds;
      return toXPos(snappedSeconds);
    };

    let xPos1;
    let xPos2;
    if (capturedTimeInterval.mode === "move") {
      const drag = dragRef.current;
      if (drag == null) {
        return;
      }

      const rangePixels =
        capturedTimeInterval.xPos2 - capturedTimeInterval.xPos1;
      const startPos = Math.min(
        capturedTimeInterval.xPos1,
        capturedTimeInterval.xPos2,
      );
      const endPos = Math.max(
        capturedTimeInterval.xPos1,
        capturedTimeInterval.xPos2,
      );

      // Clamp the offset so the range lands flush against the timeline edge
      // instead of stopping at the last valid position.
      const moveOffset = Math.max(
        leftBoundary - startPos,
        Math.min(rightBoundary - endPos, pointer.clientX - drag.lastClientX),
      );
      // Snap the leading edge, keep the pixel range exact.
      xPos1 = snapXPos(capturedTimeInterval.xPos1 + moveOffset);
      xPos2 = xPos1 + rangePixels;
      if (xPos2 < leftBoundary || xPos2 > rightBoundary) {
        xPos1 = capturedTimeInterval.xPos1 + moveOffset;
        xPos2 = capturedTimeInterval.xPos2 + moveOffset;
      }
      drag.lastClientX += moveOffset;
    } else {
      const { actionPoint } = capturedTimeInterval;
      const newXPos = snapXPos(
        Math.max(leftBoundary, Math.min(rightBoundary, pointer.clientX)),
      );
      xPos1 = actionPoint === "xPos1" ? newXPos : capturedTimeInterval.xPos1;
      xPos2 = actionPoint === "xPos2" ? newXPos : capturedTimeInterval.xPos2;
    }

    const capturedIntervalDispatchData = {
      ...capturedTimeInterval,
      xPos1,
      xPos2,
      xPos1DayOffsetSeconds: xPos1 === null ? null : toSeconds(xPos1),
      xPos2DayOffsetSeconds: xPos2 === null ? null : toSeconds(xPos2),
      ...toDurationData({
        xPos1,
        xPos2,
        hoursLineWidth: sizes.hoursLineWidth,
        formatDuration: formatDurationFn,
      }),
    };

    const fixed = colliderFn({
      timeInterval: capturedIntervalDispatchData,
      timeZonesClock: colliderStateValue.timeZonesClock,
      timeLineName: colliderStateValue.timeLineName,
    });
    applyResolution(fixed, capturedIntervalDispatchData);
  }, []);

  const handlePointerMove = useCallback(
    (ev) => {
      lastPointerRef.current = {
        clientX: ev.clientX,
        fineStep: ev.ctrlKey || ev.metaKey,
        coarseStep: ev.shiftKey,
      };
      if (rafRef.current != null) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (lastPointerRef.current) {
          applyPointer(lastPointerRef.current);
        }
      });
    },
    [applyPointer],
  );

  const cancelPendingMove = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastPointerRef.current = null;
  }, []);

  const finishDrag = useCallback(() => {
    const {
      tzState: state,
      size: sizes,
      formatDuration: formatDurationFn,
      calculateSecondsFromStartOfDay: toSeconds,
      calculatePositionFromDayOffset: toXPos,
      calculateDurationData: toDurationData,
    } = latestRef.current;

    const capturedId = capturedTimeIntervalIdRef.current;
    if (capturedId == null) {
      return;
    }

    // A queued move applied after the drop would resurrect the drag mode.
    cancelPendingMove();

    const capturedTimeInterval = state.timeIntervalsMap[capturedId];
    if (!["resize", "move", "float"].includes(capturedTimeInterval?.mode)) {
      return;
    }

    let updatedInterval = { id: capturedId, mode: "fixed" };

    if (!capturedTimeInterval.xPos2) {
      const twoHoursInSeconds = 2 * 60 * 60;

      const xPos1DayOffsetSeconds = toSeconds(capturedTimeInterval.xPos1);
      let xPos2DayOffsetSeconds = xPos1DayOffsetSeconds + twoHoursInSeconds;

      if (xPos2DayOffsetSeconds > secondsInDay) {
        xPos2DayOffsetSeconds -= twoHoursInSeconds * 2;
      }
      updatedInterval.xPos2DayOffsetSeconds = xPos2DayOffsetSeconds;
      updatedInterval.xPos2 = toXPos(xPos2DayOffsetSeconds);
      updatedInterval = {
        ...updatedInterval,
        ...toDurationData({
          xPos1: capturedTimeInterval.xPos1,
          xPos2: updatedInterval.xPos2,
          hoursLineWidth: sizes.hoursLineWidth,
          formatDuration: formatDurationFn,
        }),
      };
    }
    tzDispatch(updateTimeInterval(updatedInterval));
  }, [tzDispatch, updateTimeInterval, secondsInDay, cancelPendingMove]);

  const stopWindowDrag = useCallback(
    ({ commit }) => {
      const teardown = teardownRef.current;
      teardownRef.current = null;
      teardown?.();

      const drag = dragRef.current;
      dragRef.current = null;

      if (commit) {
        finishDrag();
        return;
      }
      cancelPendingMove();
      if (drag?.snapshot?.id != null) {
        tzDispatch(updateTimeInterval({ ...drag.snapshot, mode: "fixed" }));
      }
    },
    [finishDrag, cancelPendingMove, tzDispatch, updateTimeInterval],
  );

  const handleDragStartTimePoint = useCallback(
    (ev, id, mode, actionPoint) => {
      if (ev.button != null && ev.button !== 0) {
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();

      // A previous drag that somehow never ended must not leak listeners.
      teardownRef.current?.();

      capturedTimeIntervalIdRef.current = id;
      dragRef.current = {
        id,
        lastClientX: ev.clientX,
        snapshot: { ...latestRef.current.tzState.timeIntervalsMap[id] },
      };

      tzDispatch(
        updateTimeInterval({
          id,
          mode,
          actionPoint,
        }),
      );

      const onPointerUp = () => stopWindowDrag({ commit: true });
      const onKeyDown = (keyEv) => {
        if (keyEv.key === "Escape") {
          stopWindowDrag({ commit: false });
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("blur", onPointerUp);
      window.addEventListener("keydown", onKeyDown);

      const previousBodyCursor = document.body.style.cursor;
      document.body.style.cursor = mode === "move" ? "grabbing" : "ew-resize";

      teardownRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("blur", onPointerUp);
        window.removeEventListener("keydown", onKeyDown);
        document.body.style.cursor = previousBodyCursor;
      };
    },
    [tzDispatch, updateTimeInterval, handlePointerMove, stopWindowDrag],
  );

  // Placement of a float-mode interval: it has no pointer capture, so the
  // container's pointerup finalizes it. Window listeners own explicit drags.
  const handlePointerUp = useCallback(() => {
    if (dragRef.current != null) {
      return;
    }
    finishDrag();
  }, [finishDrag]);

  useEffect(
    () => () => {
      teardownRef.current?.();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [],
  );

  return {
    handlePointerMove,
    handlePointerUp,
    handleDragStartTimePoint,
  };
}
