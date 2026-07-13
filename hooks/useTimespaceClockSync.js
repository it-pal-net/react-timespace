import { useEffect } from "react";

import { TimeZonesClockContext } from "../state/timeZonesProvider";
import { useContext } from "react";

export default function useTimespaceClockSync({
  listElRef,
  size,
  showSeconds,
  onMinuteTick,
}) {
  const { homeDayPassedPercent, timer } = useContext(TimeZonesClockContext);

  useEffect(() => {
    if (!listElRef?.current) return;
    if (size?.hoursLineWidth == null || size?.leftOffset == null) return;
    if (homeDayPassedPercent == null) return;

    const passedPixels = (size.hoursLineWidth * homeDayPassedPercent) / 100;
    const xPos = passedPixels + size.leftOffset;
    listElRef.current.style.setProperty("--homeDayPassedXPos", `${xPos}px`);
  }, [homeDayPassedPercent, size?.hoursLineWidth, size?.leftOffset, listElRef]);

  useEffect(() => {
    if (!onMinuteTick) return;
    // If seconds are shown, tick every second; otherwise tick per minute.
    const shouldTick = showSeconds ? timer % 60 === 0 : timer % 60 === 0;
    if (shouldTick) onMinuteTick();
  }, [timer, showSeconds, onMinuteTick]);
}
