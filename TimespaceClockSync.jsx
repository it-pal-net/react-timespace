import { useContext, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import { useTimeZonesClock } from "./state/timeZonesProvider";

/**
 * Small component that subscribes to the ticking clock context and updates
 * Timespace DOM (CSS vars / refs) without forcing `TimeLineList` to rerender each second.
 */
export default function TimespaceClockSync({
  targetElRef,
  size,
  homeDayPassedXPosRef,
  positionKey,
  onMinuteTick,
  onPositionReady,
}) {
  const { homeDayPassedPercent, timer } = useTimeZonesClock() ?? {};
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
    if (homeDayPassedPercent == null) return;

    const passedPixels = (size.hoursLineWidth * homeDayPassedPercent) / 100;
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
    homeDayPassedPercent,
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
  // Used to invalidate the "position ready" cache when the reference frame changes
  // without a size change (e.g. switching home zone).
  positionKey: PropTypes.string,
  onMinuteTick: PropTypes.func,
  onPositionReady: PropTypes.func,
};
