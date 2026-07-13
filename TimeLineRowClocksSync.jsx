import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

import { useTimeZonesClock } from "./state/timeZonesProvider";

/**
 * Subscribes to the ticking clock context and writes clock strings directly into the
 * Timeline DOM. This avoids re-rendering the whole TimeLine list every tick.
 */
export default function TimeLineRowClocksSync({ listElRef, showSeconds }) {
  const { timeZonesClock, timer } = useTimeZonesClock() ?? {};
  const timeZonesClockRef = useRef(timeZonesClock ?? null);
  const lastClockObjRef = useRef(timeZonesClock ?? null);
  const forceWriteRef = useRef(false);
  const cacheRef = useRef({
    clocks: new Map(), // tz -> Element[]
    abbrevs: new Map(), // tz -> Element[]
  });
  const lastBucketRef = useRef(null);
  const rafInitRef = useRef(null);
  const rafRebuildRef = useRef(null);
  const hoverListenersRef = useRef(new Map()); // Element -> { enter, leave }
  const hoveredCountRef = useRef(0);
  const homeNowHoverRef = useRef({
    els: new Set(),
    listeners: new Map(), // Element -> { enter, leave }
    count: 0,
  });

  useEffect(() => {
    timeZonesClockRef.current = timeZonesClock ?? null;
  }, [timeZonesClock]);

  const writeNow = () => {
    const clockData = timeZonesClockRef.current;
    if (!clockData) return;

    const forceSeconds = homeNowHoverRef.current.count > 0;

    const { clocks, abbrevs } = cacheRef.current;
    clocks.forEach((els, tz) => {
      const valueMinutes = clockData?.[tz]?.hoursMinutes ?? "";
      const valueSeconds = clockData?.[tz]?.hoursMinutesSeconds ?? "";
      els.forEach((el) => {
        const wantsSeconds =
          showSeconds ||
          forceSeconds ||
          el.dataset.timelineHoverSeconds === "1";
        const next = wantsSeconds ? valueSeconds : valueMinutes;
        if (el.textContent !== next) el.textContent = next;
      });
    });

    abbrevs.forEach((els, tz) => {
      const value = clockData?.[tz]?.timeZoneAbbreviation ?? "";
      els.forEach((el) => {
        if (el.textContent !== value) el.textContent = value;
      });
    });
  };

  const clearHoverListeners = () => {
    hoverListenersRef.current.forEach(({ enter, leave }, el) => {
      try {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      } catch {
        // ignore
      }
      try {
        delete el.dataset.timelineHoverSeconds;
      } catch {
        // ignore
      }
      // If we are in minute-only mode, revert any hovered labels back to HH:MM immediately.
      if (!showSeconds) {
        try {
          const tz = el.getAttribute("data-timezone");
          const value = tz
            ? (timeZonesClockRef.current?.[tz]?.hoursMinutes ?? "")
            : "";
          if (el.textContent !== value) el.textContent = value;
        } catch {
          // ignore
        }
      }
    });
    hoverListenersRef.current.clear();
    hoveredCountRef.current = 0;
  };

  const clearHomeNowHoverListeners = () => {
    const state = homeNowHoverRef.current;
    state.listeners.forEach(({ enter, leave }, el) => {
      try {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      } catch {
        // ignore
      }
    });
    state.listeners.clear();
    state.els.clear();
    state.count = 0;
  };

  const updateAllNowClocks = (forceSeconds) => {
    const { clocks } = cacheRef.current;
    clocks.forEach((els, tz) => {
      const valueMinutes = timeZonesClockRef.current?.[tz]?.hoursMinutes ?? "";
      const valueSeconds =
        timeZonesClockRef.current?.[tz]?.hoursMinutesSeconds ?? "";
      const next = forceSeconds ? valueSeconds : valueMinutes;
      els.forEach((el) => {
        // Don't stomp per-element hover state if seconds are forced on.
        if (el.textContent !== next) el.textContent = next;
      });
    });
  };

  const setupHoverListeners = () => {
    // Seconds-on-hover is ALWAYS enabled when showSeconds is off.
    // When showSeconds is on, hover listeners are unnecessary.
    if (showSeconds) {
      clearHoverListeners();
      clearHomeNowHoverListeners();
      return;
    }

    // Reset and attach fresh listeners for the current DOM.
    clearHoverListeners();
    clearHomeNowHoverListeners();

    const { clocks } = cacheRef.current;
    clocks.forEach((els, tz) => {
      els.forEach((el) => {
        const enter = () => {
          try {
            if (el.dataset.timelineHoverSeconds === "1") return;
            el.dataset.timelineHoverSeconds = "1";
          } catch {
            // ignore
          }
          hoveredCountRef.current += 1;

          const value =
            timeZonesClockRef.current?.[tz]?.hoursMinutesSeconds ?? "";
          if (el.textContent !== value) el.textContent = value;
        };

        const leave = () => {
          try {
            if (el.dataset.timelineHoverSeconds !== "1") return;
            delete el.dataset.timelineHoverSeconds;
          } catch {
            // ignore
          }
          hoveredCountRef.current = Math.max(0, hoveredCountRef.current - 1);

          const value = timeZonesClockRef.current?.[tz]?.hoursMinutes ?? "";
          if (el.textContent !== value) el.textContent = value;
        };

        try {
          el.addEventListener("mouseenter", enter);
          el.addEventListener("mouseleave", leave);
          hoverListenersRef.current.set(el, { enter, leave });
        } catch {
          // ignore
        }
      });
    });

    // Also allow hovering the home current-hour brick to reveal seconds (global).
    const listEl = listElRef?.current ?? null;
    if (!listEl) return;
    const state = homeNowHoverRef.current;
    listEl
      .querySelectorAll('[data-timeline-home-now-hour="1"]')
      .forEach((el) => {
        if (!el) return;
        const enter = () => {
          state.count += 1;
          updateAllNowClocks(true);
        };
        const leave = () => {
          state.count = Math.max(0, state.count - 1);
          // If nothing is hovered anymore, revert all clocks back to minutes.
          if (state.count === 0 && hoveredCountRef.current === 0) {
            updateAllNowClocks(false);
          }
        };
        try {
          el.addEventListener("mouseenter", enter);
          el.addEventListener("mouseleave", leave);
          state.els.add(el);
          state.listeners.set(el, { enter, leave });
        } catch {
          // ignore
        }
      });
  };

  const rebuildCache = () => {
    const listEl = listElRef?.current ?? null;
    if (!listEl) return;
    const clocks = new Map();
    const abbrevs = new Map();

    listEl.querySelectorAll("[data-timeline-now-clock]").forEach((el) => {
      const tz = el.getAttribute("data-timezone");
      if (!tz) return;
      const arr = clocks.get(tz) ?? [];
      arr.push(el);
      clocks.set(tz, arr);
    });

    listEl.querySelectorAll("[data-timeline-tz-abbrev]").forEach((el) => {
      const tz = el.getAttribute("data-timezone");
      if (!tz) return;
      const arr = abbrevs.get(tz) ?? [];
      arr.push(el);
      abbrevs.set(tz, arr);
    });

    cacheRef.current = { clocks, abbrevs };
    setupHoverListeners();

    // When switching addressbooks/timespaces the DOM can change immediately, but our
    // steady-state throttle may delay the next tick. Force an immediate write.
    forceWriteRef.current = true;
    writeNow();
  };

  // Rebuild cache when markup may change. Also handle the case where this effect
  // runs before the list ref is attached by retrying in rAF.
  useEffect(() => {
    if (rafInitRef.current != null) {
      cancelAnimationFrame(rafInitRef.current);
      rafInitRef.current = null;
    }

    const tryInit = () => {
      if (!listElRef?.current) {
        rafInitRef.current = requestAnimationFrame(tryInit);
        return;
      }
      rebuildCache();
      rafInitRef.current = null;
    };

    tryInit();

    return () => {
      if (rafInitRef.current != null) {
        cancelAnimationFrame(rafInitRef.current);
        rafInitRef.current = null;
      }
    };
  }, [listElRef, showSeconds]);

  useEffect(() => {
    // When switching timespaces/addressbooks, the list subtree is re-rendered.
    // `rebuildCache()` must run again, otherwise new rows never get live clock/abbrev text.
    if (typeof MutationObserver === "undefined") return;
    const listEl = listElRef?.current ?? null;
    if (!listEl) return;

    const schedule = () => {
      if (rafRebuildRef.current != null) return;
      rafRebuildRef.current = requestAnimationFrame(() => {
        rafRebuildRef.current = null;
        rebuildCache();
      });
    };

    const mo = new MutationObserver((mutations) => {
      // Only rebuild when timeline row clock/abbrev elements might have changed.
      for (const m of mutations) {
        if (m.type !== "childList") continue;
        const hasRelevant = (nodes) =>
          Array.from(nodes ?? []).some((n) => {
            if (!n) return false;
            const el = n.nodeType === 1 ? n : null;
            if (!el) return false;
            if (
              el.matches?.(
                "[data-timeline-now-clock], [data-timeline-tz-abbrev]",
              )
            ) {
              return true;
            }
            return !!el.querySelector?.(
              "[data-timeline-now-clock], [data-timeline-tz-abbrev]",
            );
          });
        if (hasRelevant(m.addedNodes) || hasRelevant(m.removedNodes)) {
          schedule();
          break;
        }
      }
    });

    mo.observe(listEl, { subtree: true, childList: true });

    return () => {
      mo.disconnect();
      if (rafRebuildRef.current != null) {
        cancelAnimationFrame(rafRebuildRef.current);
        rafRebuildRef.current = null;
      }
    };
  }, [listElRef]);

  useEffect(() => {
    if (!timeZonesClock) return;

    // Throttle DOM writes:
    // - showSeconds=true  -> update every second
    // - showSeconds=false -> update every 10 seconds
    const t = timer ?? 0;
    const shouldTickEachSecond =
      showSeconds ||
      hoveredCountRef.current > 0 ||
      homeNowHoverRef.current.count > 0;
    const bucketSize = shouldTickEachSecond ? 1 : 10;
    const bucket = Math.floor(t / bucketSize);
    const clockObjChanged = lastClockObjRef.current !== timeZonesClock;
    if (
      lastBucketRef.current === bucket &&
      !clockObjChanged &&
      !forceWriteRef.current
    )
      return;
    lastBucketRef.current = bucket;
    lastClockObjRef.current = timeZonesClock;
    forceWriteRef.current = false;

    // If we haven't cached elements yet (or the list changed and cache got stale),
    // rebuild now so we can write immediately.
    const listEl = listElRef?.current ?? null;
    const domClockCount = listEl
      ? listEl.querySelectorAll("[data-timeline-now-clock]").length
      : 0;
    const domAbbrevCount = listEl
      ? listEl.querySelectorAll("[data-timeline-tz-abbrev]").length
      : 0;
    const cachedClockCount = Array.from(
      cacheRef.current.clocks.values(),
    ).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);
    const cachedAbbrevCount = Array.from(
      cacheRef.current.abbrevs.values(),
    ).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);
    if (
      cachedClockCount !== domClockCount ||
      cachedAbbrevCount !== domAbbrevCount
    ) {
      rebuildCache();
    }

    writeNow();
  }, [timeZonesClock, timer, showSeconds]);

  useEffect(() => {
    // Cleanup listeners on unmount and whenever we switch out of hover mode.
    return () => {
      clearHoverListeners();
      clearHomeNowHoverListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

TimeLineRowClocksSync.propTypes = {
  listElRef: PropTypes.object,
  showSeconds: PropTypes.bool,
};
