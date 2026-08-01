import { useCallback, useEffect, useRef, useState } from "react";

// Engage the pan only after the pointer moved a few pixels, so stray clicks
// on the hour strip never twitch the view.
const PAN_SLOP_PIXELS = 6;

/**
 * Horizontal drag-to-scroll over the hour strips: the 24h window slides in
 * whole hours while dragging, and the release keeps the window exactly where
 * it was left — the dragged hours are committed into
 * `tzState.viewOffsetHours` (no day snapping).
 *
 * Gesture handling mirrors `useTimeIntervalDrag`: the drag starts from a
 * `pointerdown` on the hour strip and is tracked with window-level
 * pointermove/pointerup listeners so it survives the cursor leaving the list;
 * Escape cancels and restores the offset from before the drag.
 */
export default function useTimelinePan({
  size,
  viewOffsetHours,
  onCommitViewOffsetHours,
}) {
  const [panHours, setPanHours] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  // Latest render values, readable from the stable window-level handlers.
  const latestRef = useRef(null);
  latestRef.current = { size, viewOffsetHours, onCommitViewOffsetHours };

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

    // Dragging the strip left pulls later hours into view (positive pan).
    const hourWidth = sizes.hoursLineWidth / 24;
    const nextPanHours = -Math.round(deltaX / hourWidth);
    pan.panHours = nextPanHours;
    setPanHours((current) =>
      current === nextPanHours ? current : nextPanHours,
    );
  }, []);

  const handlePointerMove = useCallback(
    (ev) => {
      lastPointerRef.current = { clientX: ev.clientX };
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

      if (!commit || pan == null || !pan.engaged || !pan.panHours) {
        return;
      }

      const {
        viewOffsetHours: committedOffset,
        onCommitViewOffsetHours: commitViewOffsetHours,
      } = latestRef.current;
      commitViewOffsetHours?.((committedOffset ?? 0) + pan.panHours);
    },
    [cancelPendingMove],
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
        engaged: false,
        panHours: 0,
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
