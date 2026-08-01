import { useCallback, useEffect, useRef, useState } from "react";

import { getPanCommitDayDelta } from "../core/timeLineMath";

// Engage the pan only after the pointer moved a few pixels, so stray clicks
// on the hour strip never twitch the view.
const PAN_SLOP_PIXELS = 6;
// A fast release ("flick") pages even when the distance threshold wasn't
// reached — matching the usual carousel/pager gesture.
const FLICK_MIN_VELOCITY_PX_PER_MS = 0.4;
const FLICK_MIN_DISTANCE_PIXELS = 16;
const FLICK_SAMPLE_WINDOW_MS = 120;

/**
 * Horizontal drag-to-pan over the hour strips: the 24h window slides in whole
 * hours while dragging, and the release commits whole home-zone days
 * (`viewDayOffset`) — full day-widths dragged plus one more day when the
 * remainder passes a threshold or the release is a flick.
 *
 * Gesture handling mirrors `useTimeIntervalDrag`: the drag starts from a
 * `pointerdown` on the hour strip and is tracked with window-level
 * pointermove/pointerup listeners so it survives the cursor leaving the list;
 * Escape cancels and springs back to the committed day.
 */
export default function useTimelineDayPan({
  size,
  viewDayOffset,
  onCommitDayOffset,
}) {
  const [panHours, setPanHours] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  // Latest render values, readable from the stable window-level handlers.
  const latestRef = useRef(null);
  latestRef.current = { size, viewDayOffset, onCommitDayOffset };

  const panRef = useRef(null);
  const teardownRef = useRef(null);
  const rafRef = useRef(null);
  const lastPointerRef = useRef(null);

  const cancelPendingMove = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastPointerRef.current = null;
  }, []);

  const applyPointer = useCallback((pointer) => {
    const pan = panRef.current;
    const { size: sizes } = latestRef.current;
    if (pan == null || !sizes?.hoursLineWidth) {
      return;
    }

    const deltaX = pointer.clientX - pan.startClientX;
    if (!pan.engaged) {
      if (Math.abs(deltaX) < PAN_SLOP_PIXELS) {
        return;
      }
      pan.engaged = true;
      setIsPanning(true);
    }

    pan.lastClientX = pointer.clientX;
    const now = pointer.timeStamp;
    pan.samples.push({ t: now, x: pointer.clientX });
    while (
      pan.samples.length > 1 &&
      now - pan.samples[0].t > FLICK_SAMPLE_WINDOW_MS
    ) {
      pan.samples.shift();
    }

    // Dragging the strip left pulls later hours into view (positive pan).
    const hourWidth = sizes.hoursLineWidth / 24;
    const nextPanHours = -Math.round(deltaX / hourWidth);
    setPanHours((current) =>
      current === nextPanHours ? current : nextPanHours,
    );
  }, []);

  const handlePointerMove = useCallback(
    (ev) => {
      lastPointerRef.current = {
        clientX: ev.clientX,
        timeStamp: ev.timeStamp,
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

  const getFlickDayDirection = useCallback((pan) => {
    const newest = pan.samples[pan.samples.length - 1];
    const oldest = pan.samples[0];
    if (!newest || !oldest || newest.t <= oldest.t) {
      return 0;
    }
    const distance = newest.x - oldest.x;
    const velocity = distance / (newest.t - oldest.t);
    if (
      Math.abs(distance) < FLICK_MIN_DISTANCE_PIXELS ||
      Math.abs(velocity) < FLICK_MIN_VELOCITY_PX_PER_MS
    ) {
      return 0;
    }
    // Flicking leftwards travels toward later days.
    return velocity < 0 ? 1 : -1;
  }, []);

  const stopPan = useCallback(
    ({ commit }) => {
      const teardown = teardownRef.current;
      teardownRef.current = null;
      teardown?.();

      const pan = panRef.current;
      panRef.current = null;
      cancelPendingMove();
      setIsPanning(false);
      setPanHours(0);

      if (!commit || pan == null || !pan.engaged) {
        return;
      }

      const {
        size: sizes,
        viewDayOffset: committedOffset,
        onCommitDayOffset: commitDayOffset,
      } = latestRef.current;
      if (!sizes?.hoursLineWidth) {
        return;
      }

      const hourWidth = sizes.hoursLineWidth / 24;
      const draggedHours = -(pan.lastClientX - pan.startClientX) / hourWidth;
      const dayDelta = getPanCommitDayDelta(
        draggedHours,
        getFlickDayDirection(pan),
      );
      if (dayDelta !== 0) {
        commitDayOffset?.((committedOffset ?? 0) + dayDelta);
      }
    },
    [cancelPendingMove, getFlickDayDirection],
  );

  const handlePanPointerDown = useCallback(
    (ev) => {
      if (ev.button != null && ev.button !== 0) {
        return;
      }
      // Only the hour strips pan; headers, clocks and the row drag handle
      // keep their own interactions.
      if (!ev.target?.closest?.(".timeline")) {
        return;
      }
      if (!latestRef.current.size?.hoursLineWidth) {
        return;
      }

      // A previous pan that somehow never ended must not leak listeners.
      teardownRef.current?.();

      panRef.current = {
        startClientX: ev.clientX,
        lastClientX: ev.clientX,
        engaged: false,
        samples: [{ t: ev.timeStamp, x: ev.clientX }],
      };

      const onPointerUp = () => stopPan({ commit: true });
      const onKeyDown = (keyEv) => {
        if (keyEv.key === "Escape") {
          stopPan({ commit: false });
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("blur", onPointerUp);
      window.addEventListener("keydown", onKeyDown);

      const previousBodyCursor = document.body.style.cursor;
      document.body.style.cursor = "grabbing";

      teardownRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("blur", onPointerUp);
        window.removeEventListener("keydown", onKeyDown);
        document.body.style.cursor = previousBodyCursor;
      };
    },
    [handlePointerMove, stopPan],
  );

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
    panHours,
    isPanning,
    handlePanPointerDown,
  };
}
