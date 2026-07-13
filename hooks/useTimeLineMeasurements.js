import { useCallback, useEffect, useRef, useState } from "react";

import useResizable from "./useResizable";

export default function useTimeLineMeasurements({
  timeLinesLength,
  timeIntervalsLength,
  uiScale,
  measureElRef,
  invalidateKey,
}) {
  const listElRef = useRef(null);
  const firstTimelineElRef = useRef(null);
  const firstHeaderElRef = useRef(null);
  const firstHoursElRef = useRef(null);
  const timeIntervalClockSampleElRef = useRef(null);
  const timeZonesClockSampleElRef = useRef(null);

  const [size, setSize] = useState({
    bodyHeight: null,
    hoursLineWidth: null,
    topOffset: null,
    topOffsetRelative: null,
    tailOffset: null,
    leftOffset: null,
    leftListOffset: null,
    maxHeaderWidth: null,
    headerFontPx: null,
    timeZonesClockWidth: null,
    timeIntervalClockWidth: null,
    timeLineItemHeaderHeight: null,
  });

  const measureSize = useCallback(() => {
    if (
      listElRef.current === null ||
      firstTimelineElRef.current === null ||
      firstHeaderElRef.current === null ||
      firstHoursElRef.current === null ||
      timeIntervalClockSampleElRef.current === null ||
      timeZonesClockSampleElRef.current === null
    ) {
      return;
    }

    const listElRect = listElRef.current.getBoundingClientRect();
    const firstTimelineElRect =
      firstTimelineElRef.current.getBoundingClientRect();
    const firstHeaderElRect = firstHeaderElRef.current.getBoundingClientRect();
    const firstHoursElRect = firstHoursElRef.current.getBoundingClientRect();
    const firstTimeZonesTimeZonesClockElRect =
      timeZonesClockSampleElRef.current.getBoundingClientRect();

    const topListOffset = listElRect.top;
    const timeLineItemHeaderHeight = firstHeaderElRect.height;
    const topTailOffset = firstHeaderElRect.height;
    const topFirstLineOffset = firstTimelineElRect.top;

    const itemsHeight =
      timeLinesLength * firstTimelineElRect.height + topTailOffset;
    const listHeight = listElRect.height;

    const tailBodyHeight =
      itemsHeight > listHeight
        ? listHeight + timeLineItemHeaderHeight
        : itemsHeight;

    const headerContentEls = Array.from(
      listElRef.current.querySelectorAll(".time-line-header-content"),
    );
    const headerWidths = headerContentEls.map((header) => header.offsetWidth);
    // Natural (uncollided) font size of the header row. Used to convert the
    // collision-shrunk timezone-name font into a `transform: scale`, which keeps
    // `maxHeaderWidth` measured at natural size (a collision-shrunk font would
    // otherwise feed a smaller width back into the collision decision → oscillation).
    const headerFontPx = headerContentEls[0]
      ? parseFloat(getComputedStyle(headerContentEls[0]).fontSize) || null
      : null;

    const topOffsetRelative =
      itemsHeight >= listHeight ? 0 : firstTimelineElRect.top - listElRect.top;

    setSize((currentSize) => ({
      ...currentSize,
      bodyHeight: tailBodyHeight,
      hoursLineWidth: firstHoursElRect.width,
      topOffset: itemsHeight > listHeight ? topListOffset : topFirstLineOffset,
      topOffsetRelative,
      tailOffset: topTailOffset,
      timeLineItemHeaderHeight,
      leftOffset: firstHoursElRect.left - listElRect.left,
      leftListOffset: listElRect.left,
      maxHeaderWidth: headerWidths.length ? Math.max(...headerWidths) : 0,
      headerFontPx,
      timeZonesClockWidth: firstTimeZonesTimeZonesClockElRect.width,
      timeIntervalClockWidth:
        timeIntervalClockSampleElRef.current.getBoundingClientRect().width,
    }));
  }, [timeLinesLength, timeIntervalsLength, uiScale, invalidateKey]);

  useEffect(() => {
    let rafId = null;
    let timeoutId = null;
    let cancelled = false;

    const hasRefs = () =>
      listElRef.current !== null &&
      firstTimelineElRef.current !== null &&
      firstHeaderElRef.current !== null &&
      firstHoursElRef.current !== null &&
      timeIntervalClockSampleElRef.current !== null &&
      timeZonesClockSampleElRef.current !== null;

    const tryMeasure = () => {
      if (cancelled) return;
      if (!hasRefs()) {
        rafId = requestAnimationFrame(tryMeasure);
        return;
      }

      measureSize();
      // Because measured values can be involved in size-related calculations
      // and we need to measure them again after they are updated
      timeoutId = setTimeout(measureSize, 250);
    };

    tryMeasure();

    return () => {
      cancelled = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [measureSize, measureElRef]);

  useResizable(measureElRef ?? listElRef, measureSize);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    let raf = null;
    const scheduleMeasure = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        measureSize();
      });
    };

    const lastRectRef = { current: { width: null, height: null } };
    const ro = new ResizeObserver((entries) => {
      // Only remeasure when the container box size changes (not when text inside changes).
      const entry = entries?.[0];
      const w = entry?.contentRect?.width ?? null;
      const h = entry?.contentRect?.height ?? null;
      if (
        w != null &&
        h != null &&
        lastRectRef.current.width === w &&
        lastRectRef.current.height === h
      ) {
        return;
      }
      lastRectRef.current.width = w;
      lastRectRef.current.height = h;
      scheduleMeasure();
    });

    // Target only the scrolling container (header/hour text updates can trigger RO a lot).
    const target = measureElRef?.current ?? listElRef.current ?? null;
    if (target) ro.observe(target);

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [measureSize]);

  useEffect(() => {
    // We intentionally avoid remeasuring on every clock tick (text-only updates).
    // However, on first render and when switching timespaces/addressbooks, the timeline
    // header contains "empty" placeholders that get populated via direct DOM writes
    // (see `TimeLineRowClocksSync`). That can change header widths and cause temporary
    // overlap until something triggers a measure.
    //
    // This observer triggers a re-measure once when those placeholders first receive
    // non-empty text, then becomes effectively inert for subsequent tick updates.
    if (typeof MutationObserver === "undefined") return;

    const root = listElRef.current;
    if (!root) return;

    let raf = null;
    let idleTimeout = null;

    const scheduleMeasure = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        measureSize();
      });
    };

    const markIfJustPopulated = (el) => {
      if (!el) return false;
      if (el.dataset?.measuredInitText === "1") return false;
      const txt = (el.textContent ?? "").trim();
      if (!txt) return false;
      el.dataset.measuredInitText = "1";
      return true;
    };

    const handle = (node) => {
      if (!node) return false;
      const el = node.nodeType === 1 ? node : node.parentElement;
      if (!el) return false;

      // Only care about placeholders that are empty initially and later populated.
      const targets = [];
      const selfTarget =
        el.matches?.("[data-timeline-now-clock], [data-timeline-tz-abbrev]") ??
        false;
      if (selfTarget) targets.push(el);
      el.querySelectorAll?.(
        "[data-timeline-now-clock], [data-timeline-tz-abbrev]",
      ).forEach((x) => targets.push(x));

      let changed = false;
      targets.forEach((t) => {
        if (markIfJustPopulated(t)) changed = true;
      });
      return changed;
    };

    const mo = new MutationObserver((mutations) => {
      let shouldMeasure = false;

      for (const m of mutations) {
        if (m.type === "characterData") {
          if (handle(m.target)) shouldMeasure = true;
        } else if (m.type === "childList") {
          m.addedNodes?.forEach((n) => {
            if (handle(n)) shouldMeasure = true;
          });
          if (handle(m.target)) shouldMeasure = true;
        }
      }

      if (!shouldMeasure) return;
      scheduleMeasure();

      // If there are many rapid mutations (mounting a new list), keep observing,
      // but disconnect after the stream settles.
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        mo.disconnect();
      }, 500);
    });

    mo.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      if (idleTimeout) clearTimeout(idleTimeout);
      mo.disconnect();
    };
  }, [timeLinesLength, timeIntervalsLength, measureSize]);

  return {
    size,
    refs: {
      listElRef,
      firstTimelineElRef,
      firstHeaderElRef,
      firstHoursElRef,
      timeIntervalClockSampleElRef,
      timeZonesClockSampleElRef,
    },
    measureSize,
  };
}
