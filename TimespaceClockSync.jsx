import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

import { useTimeZonesClock } from "./state/timeZonesProvider";
import { getNowHandWindowFraction } from "./core/timeLineMath";

/**
 * Small component that subscribes to the ticking clock context and updates
 * Timespace DOM (CSS vars / refs) without forcing `TimeLineList` to rerender each second.
 *
 * The "now" position is relative to the viewed 24h window (`viewStartUtcMs`),
 * so a scrolled window keeps the hand glued to the correct hour column; when
 * "now" is outside the window the hand becomes a ghost — the current wall
 * time projected onto the viewed day (see `getNowHandWindowFraction`).
 */
export default function TimespaceClockSync({
  targetElRef,
  size,
  homeDayPassedXPosRef,
  viewStartUtcMs,
  todayStartUtcMs,
  viewOffsetSeconds,
  positionKey,
  onMinuteTick,
  onPositionReady,
}) {
  const { timer } = useTimeZonesClock() ?? {};
  const lastMinuteRef = useRef(null);
  const lastSizeKeyRef = useRef(null);

  useEffect(() => {
    if (!targetElRef?.current) return;
    if (
      size?.hoursLineWidth == null ||
      size?.leftOffset == null ||
      size?.leftListOffset == null
    )
      return;
    if (timer == null || viewStartUtcMs == null) return;

    const { fraction } = getNowHandWindowFraction({
      nowUtcMs: timer * 1000,
      viewStartUtcMs,
      todayStartUtcMs: todayStartUtcMs ?? viewStartUtcMs,
      viewOffsetSeconds: viewOffsetSeconds ?? 0,
    });
    const passedPixels = size.hoursLineWidth * fraction;
    // Two coordinate spaces are used:
    // - CSS var: relative to the timeline/list container
    // - collision math: viewport coordinates (used with drag/drop x positions)
    const xPosRelative = passedPixels + size.leftOffset;
    const xPosViewport = xPosRelative + size.leftListOffset;

    homeDayPassedXPosRef.current = xPosViewport;
    targetElRef.current.style.setProperty(
      "--homeDayPassedXPos",
      `${xPosRelative}px`,
    );

    // On initial mount and after the first "delayed measure" pass, we can end up
    // with clocks/labels rendered before positions are correct. Notify parent to
    // recompute collision/layout once per size change (not every tick).
    // Include a caller-provided key (e.g. homeZone) to also trigger a recompute when
    // the reference frame changes without a size change.
    const sizeKey = `${size.hoursLineWidth}|${size.leftOffset}|${size.leftListOffset}|${positionKey ?? ""}`;
    if (lastSizeKeyRef.current !== sizeKey) {
      lastSizeKeyRef.current = sizeKey;
      if (typeof onPositionReady === "function") {
        onPositionReady();
      }
    }
  }, [
    timer,
    viewStartUtcMs,
    todayStartUtcMs,
    viewOffsetSeconds,
    size?.hoursLineWidth,
    size?.leftOffset,
    size?.leftListOffset,
    targetElRef,
    homeDayPassedXPosRef,
    positionKey,
    onPositionReady,
  ]);

  useEffect(() => {
    if (!onMinuteTick) return;
    const minute = Math.floor(timer / 60);
    if (lastMinuteRef.current === minute) return;
    lastMinuteRef.current = minute;
    onMinuteTick();
  }, [timer, onMinuteTick]);

  return null;
}

TimespaceClockSync.propTypes = {
  targetElRef: PropTypes.object,
  size: PropTypes.object,
  homeDayPassedXPosRef: PropTypes.object.isRequired,
  // UTC ms of the viewed window's first column.
  viewStartUtcMs: PropTypes.number,
  // UTC ms of the start of today in the home zone (ghost wall-time anchor).
  todayStartUtcMs: PropTypes.number,
  // Seconds into its home-zone day at the viewed window's left edge.
  viewOffsetSeconds: PropTypes.number,
  // Used to invalidate the "position ready" cache when the reference frame changes
  // without a size change (e.g. switching home zone).
  positionKey: PropTypes.string,
  onMinuteTick: PropTypes.func,
  onPositionReady: PropTypes.func,
};
