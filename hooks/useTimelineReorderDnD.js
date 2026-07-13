import { useEffect, useRef } from "react";

import { setTimelines } from "../state/actions";

import {
  getPreviewOrderIds,
  getReorderPreviewDeltas,
  findOverIdByPointerY,
} from "../core/timelineReorderPreview";

export default function useTimelineReorderDnD({
  timeLines,
  portalContainer,
  timeLinesMap,
  tzDispatch,
  onSetTimelinesOrder,
  size,
  backdropFilter,
  zIndexFloors,
  cssVarSourceElRef,
  listElRef,
}) {
  const timeLinesRef = useRef(timeLines);
  const transparentDragImageRef = useRef(null);
  const clonedElementRef = useRef(null);
  const activeIdRef = useRef(null);
  const activeRowElRef = useRef(null);
  const overIdRef = useRef(null);
  const lastOverElRef = useRef(null);
  const dragOffsetsRef = useRef({ top: null, bottom: null });
  const lastHomeXCssRef = useRef(null);

  const reorderPreviewRef = useRef({
    itemElById: new Map(),
    orderIds: [],
    topById: new Map(),
    heightById: new Map(),
    lockedIds: new Set(),
    lastPreviewOrderIds: null,
  });
  const rafPreviewRef = useRef(null);
  const pendingOverIdRef = useRef(null);
  const acceptedOverIdRef = useRef(null);
  const didDropRef = useRef(false);
  const commitRef = useRef({
    scheduled: false,
    raf: null,
    pending: null, // { activeId, overId }
  });
  const fadeRef = useRef({
    maxTravelRatio: 0,
    maxFade: 0.6,
    lockedHidden: false,
  });
  const dropFlashRef = useRef({
    lastEl: null,
    timer: null,
  });

  useEffect(() => {
    timeLinesRef.current = timeLines;
  }, [timeLines]);

  const debugEnabled = () => {
    try {
      return (
        typeof window !== "undefined" &&
        window?.localStorage?.getItem("timelineDndDebug") === "1"
      );
    } catch (_err) {
      return false;
    }
  };

  const debugLog = (...args) => {
    if (!debugEnabled()) return;
    // eslint-disable-next-line no-console
    console.debug("[timeline-dnd]", ...args);
  };

  const updateGhostTop = (clientY) => {
    if (
      !clonedElementRef.current ||
      size?.topOffset == null ||
      size?.bodyHeight == null
    ) {
      return;
    }
    const topYOffset = dragOffsetsRef.current.top ?? 0;
    const bottomYOffset = dragOffsetsRef.current.bottom ?? 0;
    const draggedHeight = topYOffset + bottomYOffset;

    if (size.topOffset > clientY - topYOffset) {
      clonedElementRef.current.style.top = `${size.topOffset}px`;
    } else if (size.topOffset + size.bodyHeight < clientY + bottomYOffset) {
      clonedElementRef.current.style.top = `${
        size.topOffset + size.bodyHeight - draggedHeight
      }px`;
    } else {
      clonedElementRef.current.style.top = `${clientY - topYOffset}px`;
    }
  };

  const handleDragTimeLine = (ev) => {
    // `drag` fires on the source element continuously; use it to keep the ghost
    // following the cursor even when `dragover` events are sparse.
    if (!ev) return;
    if (typeof ev.clientY === "number") {
      updateGhostTop(ev.clientY);
    }
  };

  const cleanupClone = () => {
    if (clonedElementRef.current) {
      const parent = clonedElementRef.current.parentNode;
      if (parent) parent.removeChild(clonedElementRef.current);
      clonedElementRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupClone();
      if (rafPreviewRef.current != null) {
        cancelAnimationFrame(rafPreviewRef.current);
        rafPreviewRef.current = null;
      }
      if (commitRef.current.raf != null) {
        cancelAnimationFrame(commitRef.current.raf);
        commitRef.current.raf = null;
      }
      if (dropFlashRef.current.timer != null) {
        clearTimeout(dropFlashRef.current.timer);
        dropFlashRef.current.timer = null;
      }
      if (dropFlashRef.current.lastEl) {
        dropFlashRef.current.lastEl.classList.remove("dnd-drop-flash");
        dropFlashRef.current.lastEl = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashDroppedRow = (id) => {
    const listEl = listElRef?.current ?? null;
    if (!listEl || !id) return;

    // Clear previous flash.
    if (dropFlashRef.current.timer != null) {
      clearTimeout(dropFlashRef.current.timer);
      dropFlashRef.current.timer = null;
    }
    if (dropFlashRef.current.lastEl) {
      dropFlashRef.current.lastEl.classList.remove("dnd-drop-flash");
      dropFlashRef.current.lastEl = null;
    }

    const el = listEl.querySelector(
      `.time-line-item[data-timeline-id="${CSS.escape(String(id))}"]`,
    );
    if (!el) return;

    // Restart animation by forcing reflow.
    el.classList.remove("dnd-drop-flash");
    // eslint-disable-next-line no-unused-expressions
    el.offsetHeight;
    el.classList.add("dnd-drop-flash");
    dropFlashRef.current.lastEl = el;
    dropFlashRef.current.timer = setTimeout(() => {
      el.classList.remove("dnd-drop-flash");
      if (dropFlashRef.current.lastEl === el)
        dropFlashRef.current.lastEl = null;
      dropFlashRef.current.timer = null;
    }, 500);
  };

  const scheduleCommitReorder = (reason) => {
    if (commitRef.current.scheduled) return true;
    const activeId = activeIdRef.current;
    const overId = overIdRef.current;
    if (!activeId || !overId || activeId === overId) {
      debugLog("commit skipped", { reason, activeId, overId });
      return false;
    }

    commitRef.current.scheduled = true;
    commitRef.current.pending = { activeId, overId };
    const start = performance.now();

    commitRef.current.raf = requestAnimationFrame(() => {
      commitRef.current.raf = null;
      const pending = commitRef.current.pending;
      commitRef.current.pending = null;

      if (!pending?.activeId || !pending?.overId) {
        commitRef.current.scheduled = false;
        return;
      }

      const { activeId: aId, overId: oId } = pending;
      const tlNow = timeLinesRef.current ?? [];

      const lockedIds = new Set(
        (tlNow ?? []).filter((t) => t?.isLocked).map((t) => t.id),
      );
      const unlocked = (tlNow ?? []).filter((t) => !lockedIds.has(t.id));
      const from = unlocked.findIndex((t) => t.id === aId);
      const to = unlocked.findIndex((t) => t.id === oId);
      if (from === -1 || to === -1 || from === to) {
        commitRef.current.scheduled = false;
        debugLog("commit aborted (indices)", { reason, aId, oId, from, to });
        return;
      }

      const reorderedUnlocked = [...unlocked];
      const [moved] = reorderedUnlocked.splice(from, 1);
      reorderedUnlocked.splice(to, 0, moved);

      // Rebuild full list while keeping locked timelines in their original indices.
      const next = [];
      let unlockedCursor = 0;
      for (const tl of tlNow) {
        if (lockedIds.has(tl.id)) next.push(tl);
        else next.push(reorderedUnlocked[unlockedCursor++]);
      }

      tzDispatch(
        setTimelines(
          next.map((tl, index) => ({
            ...tl,
            orderId: index + 1,
          })),
        ),
      );

      debugLog("commit applied", {
        reason,
        aId,
        oId,
        ms: Math.round(performance.now() - start),
      });

      // Run after the state update is enqueued.
      if (onSetTimelinesOrder) onSetTimelinesOrder();

      // Highlight the moved timeline in its new position after DOM updates.
      // Two rAFs is a cheap way to wait for React to commit the reorder.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flashDroppedRow(aId);
        });
      });

      commitRef.current.scheduled = false;
    });

    return true;
  };

  const clearReorderPreviewTransforms = ({ activeId } = {}) => {
    const { itemElById, orderIds } = reorderPreviewRef.current;
    orderIds.forEach((id) => {
      const el = itemElById.get(id);
      if (!el) return;
      el.style.transform = "";
      el.style.willChange = "";
      // Avoid fighting the active row's opacity transition.
      if (id !== activeId) el.style.transition = "";
    });
    reorderPreviewRef.current.lastPreviewOrderIds = null;
  };

  const resetReorderPreviewStyles = ({ activeId } = {}) => {
    const { itemElById, orderIds } = reorderPreviewRef.current;
    orderIds.forEach((id) => {
      const el = itemElById.get(id);
      if (!el) return;
      el.style.opacity = "";
      el.style.visibility = "";
      el.style.transform = "";
      el.style.transition = "";
      el.style.willChange = "";
    });
    reorderPreviewRef.current.lastPreviewOrderIds = null;
  };

  const applyDraggedRowFade = ({ activeId, overId, yInList }) => {
    const listEl = listElRef?.current ?? null;
    if (!listEl) return;

    const { itemElById, topById, heightById } = reorderPreviewRef.current;
    const activeEl = itemElById.get(activeId);
    if (!activeEl) return;

    const activeTop = topById.get(activeId) ?? null;
    const activeH = heightById.get(activeId) ?? null;
    const overTop = topById.get(overId) ?? null;
    const overH = heightById.get(overId) ?? null;
    if (activeTop == null || activeH == null) {
      activeEl.style.transition = "opacity 80ms linear";
      activeEl.style.opacity = "1";
      activeEl.style.visibility = "";
      return;
    }

    // Robust fade driver: distance moved away from the original slot.
    // This avoids cases where "overlap ratio" never reaches 1 due to
    // offsets/scrolling and leaves text visible in the placeholder gap.
    const activeMid = activeTop + activeH / 2;
    const dist = Math.abs(yInList - activeMid);
    const travelRatio = Math.min(1, dist / activeH);
    // Prevent flicker: once we fade out some amount during this drag, do not
    // fade back in until drag ends.
    fadeRef.current.maxTravelRatio = Math.max(
      fadeRef.current.maxTravelRatio ?? 0,
      travelRatio,
    );
    const stableTravelRatio = fadeRef.current.maxTravelRatio;

    // Fade out quickly once you meaningfully leave the original row.
    const start = 0.05;
    const end = 0.6;
    const rawT = (stableTravelRatio - start) / (end - start);
    const t = Math.min(1, Math.max(0, rawT));
    // IMPORTANT: keep fade monotonic to avoid flicker.
    // - If we ever accept a target, allow full fade for the remainder of this drag.
    // - Never reduce the fade strength mid-drag (maxFade is monotonic).
    const nextMaxFade = overId && overId !== activeId ? 1 : 0.6;
    fadeRef.current.maxFade = Math.max(
      fadeRef.current.maxFade ?? 0.6,
      nextMaxFade,
    );
    const opacity = 1 - t * (fadeRef.current.maxFade ?? 0.6);

    activeEl.style.transition = "opacity 80ms linear";
    activeEl.style.opacity = String(opacity);
    // Visibility should also be monotonic: once hidden during a drag, keep hidden.
    if (opacity <= 0.02) fadeRef.current.lockedHidden = true;
    activeEl.style.visibility = fadeRef.current.lockedHidden ? "hidden" : "";
  };

  const buildReorderPreviewCache = () => {
    const listEl = listElRef?.current ?? null;
    if (!listEl) return;

    const itemEls = Array.from(
      listEl.querySelectorAll(".time-line-item[data-timeline-id]"),
    );

    const itemElById = new Map();
    const topById = new Map();
    const heightById = new Map();
    itemEls.forEach((el) => {
      const id = el.getAttribute("data-timeline-id");
      if (!id) return;
      itemElById.set(id, el);
      // `offsetTop` is relative to the scrolling container and is stable under scroll.
      topById.set(id, el.offsetTop);
      heightById.set(id, el.offsetHeight);
    });

    // Prefer the state order (matches drop semantics) vs DOM query order.
    const orderIds = (timeLines ?? []).map((t) => t.id).filter(Boolean);
    const lockedIds = new Set(
      (timeLines ?? []).filter((t) => t?.isLocked).map((t) => t.id),
    );

    reorderPreviewRef.current = {
      itemElById,
      orderIds,
      topById,
      heightById,
      lockedIds,
      lastPreviewOrderIds: null,
    };
  };

  const scheduleReorderPreview = () => {
    if (rafPreviewRef.current != null) return;
    rafPreviewRef.current = requestAnimationFrame(() => {
      rafPreviewRef.current = null;
      const activeId = activeIdRef.current;
      const overId = pendingOverIdRef.current;

      if (!activeId || !overId || activeId === overId) {
        clearReorderPreviewTransforms({ activeId });
        return;
      }

      const { orderIds, topById, itemElById, lastPreviewOrderIds } =
        reorderPreviewRef.current;
      if (!orderIds.length) return;

      const lockedIds = reorderPreviewRef.current.lockedIds ?? new Set();
      const unlockedOrderIds = orderIds.filter((id) => !lockedIds.has(id));
      if (!unlockedOrderIds.length) return;

      const previewOrderIds = getPreviewOrderIds({
        orderIds: unlockedOrderIds,
        activeId,
        overId,
      });
      if (!previewOrderIds) return;

      const sameAsLast =
        Array.isArray(lastPreviewOrderIds) &&
        lastPreviewOrderIds.length === previewOrderIds.length &&
        lastPreviewOrderIds.every((id, idx) => id === previewOrderIds[idx]);
      if (sameAsLast) return;
      reorderPreviewRef.current.lastPreviewOrderIds = previewOrderIds;

      const deltas = getReorderPreviewDeltas({
        originalOrderIds: unlockedOrderIds,
        previewOrderIds,
        topById,
      });

      orderIds.forEach((id) => {
        const el = itemElById.get(id);
        if (!el) return;
        if (lockedIds.has(id)) {
          el.style.transform = "";
          el.style.transition = "";
          el.style.willChange = "";
          return;
        }
        if (id === activeId) {
          // Keep the dragged element in its original slot; the visual is handled by the ghost.
          el.style.transform = "";
          // IMPORTANT: do not touch `transition` here.
          // `applyDraggedRowFade()` controls opacity transitions; clearing the transition
          // here causes visible flicker (opacity transition gets reset every rAF).
          el.style.willChange = "";
          return;
        }
        const delta = deltas?.[id] ?? 0;
        el.style.transition = "transform 120ms ease";
        el.style.willChange = delta ? "transform" : "";
        el.style.transform = delta ? `translateY(${delta}px)` : "";
      });
    });
  };

  const handleDragOverTimeLineList = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";

    const activeId = activeIdRef.current;
    if (!activeId) return;

    const listEl = listElRef?.current ?? null;
    if (!listEl) return;

    const rect = listEl.getBoundingClientRect();
    const yClientInList = ev.clientY - rect.top;
    const distanceToBottom = rect.bottom - ev.clientY;
    const y = ev.clientY - rect.top + listEl.scrollTop;

    const { orderIds, topById, heightById, lockedIds, itemElById } =
      reorderPreviewRef.current;

    // Dead-zone: if pointer is still inside the dragged row's original bounds,
    // don't resolve a target yet. This prevents the row below from "jumping up"
    // immediately on drag start.
    const activeTop = topById.get(activeId) ?? null;
    const activeH = heightById.get(activeId) ?? null;
    if (activeTop != null && activeH != null) {
      const withinActive = y >= activeTop && y <= activeTop + activeH;
      if (withinActive) {
        overIdRef.current = null;
        pendingOverIdRef.current = null;
        acceptedOverIdRef.current = null;
        clearReorderPreviewTransforms({ activeId });
        applyDraggedRowFade({ activeId, overId: null, yInList: y });
        if (lastOverElRef.current) {
          lastOverElRef.current.classList.remove("over");
          lastOverElRef.current = null;
        }
        updateGhostTop(ev.clientY);
        return;
      }
    }

    // Keep clock line CSS var in sync while dragging (cheap string copy).
    if (clonedElementRef.current && cssVarSourceElRef?.current) {
      const homeX = cssVarSourceElRef.current.style.getPropertyValue(
        "--homeDayPassedXPos",
      );
      if (homeX && lastHomeXCssRef.current !== homeX) {
        clonedElementRef.current.style.setProperty(
          "--homeDayPassedXPos",
          homeX,
        );
        lastHomeXCssRef.current = homeX;
      }
    }

    // Edge zones: make it easier to reorder to the very top/bottom without requiring
    // crossing the first/last item's midpoint.
    const EDGE_PX = 24;
    const unlockedOrderIds = orderIds.filter((id) => id && !lockedIds.has(id));
    const unlockedCandidates = unlockedOrderIds.filter((id) => id !== activeId);
    let overId = null;
    if (unlockedCandidates.length) {
      if (yClientInList <= EDGE_PX) {
        overId = unlockedCandidates[0];
      } else if (distanceToBottom <= EDGE_PX) {
        overId = unlockedCandidates[unlockedCandidates.length - 1];
      }
    }

    if (!overId) {
      overId = findOverIdByPointerY({
        orderIds,
        activeId,
        y,
        topById,
        heightById,
        lockedIds,
      });
    }

    if (!overId) {
      // Still update ghost position + fade so the source row can "lift" even
      // when we're in a gap and don't have a target yet.
      updateGhostTop(ev.clientY);
      applyDraggedRowFade({ activeId, overId: null, yInList: y });
      return;
    }

    const currentAccepted = acceptedOverIdRef.current;
    let nextAccepted = currentAccepted;
    if (!currentAccepted || currentAccepted === activeId) {
      nextAccepted = null;
    }

    // Only accept a *new* target when the dragged row overlaps it enough.
    // This uses an approximate dragged-rect (based on pointer + drag offset),
    // which is much closer to a "real" overlap model than midpoint/cursor gating.
    //
    // Note: because our drag handle is at the bottom, upward moves can feel
    // "harder" (cursor sits near the bottom of the dragged box). Use a slightly
    // lower threshold when moving up to keep the UX symmetric.
    if (activeTop != null && activeH != null) {
      const overTop = topById.get(overId) ?? null;
      const overH = heightById.get(overId) ?? null;
      if (overTop != null && overH != null) {
        const activeIndex = unlockedOrderIds.indexOf(activeId);
        const candidateIndex = unlockedOrderIds.indexOf(overId);
        const movingDown =
          activeIndex !== -1 && candidateIndex !== -1
            ? candidateIndex > activeIndex
            : y > activeTop + activeH / 2;
        const OVERLAP_RATIO_TRIGGER = movingDown ? 0.6 : 0.45;

        const topYOffset = dragOffsetsRef.current.top ?? activeH / 2;
        const draggedTop = y - topYOffset;
        const draggedBottom = draggedTop + activeH;
        const overBottom = overTop + overH;

        const intersection = Math.max(
          0,
          Math.min(draggedBottom, overBottom) - Math.max(draggedTop, overTop),
        );
        const ratio = intersection / Math.min(activeH, overH);

        if (ratio >= OVERLAP_RATIO_TRIGGER) {
          nextAccepted = overId;
        }
      }
    }

    acceptedOverIdRef.current = nextAccepted;

    // If we have an accepted target, keep it stable; otherwise don't reorder yet.
    if (!acceptedOverIdRef.current) {
      overIdRef.current = null;
      pendingOverIdRef.current = null;
      clearReorderPreviewTransforms({ activeId });
      applyDraggedRowFade({ activeId, overId: null, yInList: y });
      if (lastOverElRef.current) {
        lastOverElRef.current.classList.remove("over");
        lastOverElRef.current = null;
      }
      updateGhostTop(ev.clientY);
      return;
    }

    overIdRef.current = acceptedOverIdRef.current;
    pendingOverIdRef.current = acceptedOverIdRef.current;
    scheduleReorderPreview();
    updateGhostTop(ev.clientY);
    applyDraggedRowFade({
      activeId,
      overId: acceptedOverIdRef.current,
      yInList: y,
    });

    const overEl = itemElById.get(acceptedOverIdRef.current) ?? null;
    if (overEl && lastOverElRef.current !== overEl) {
      if (lastOverElRef.current) lastOverElRef.current.classList.remove("over");
      overEl.classList.add("over");
      lastOverElRef.current = overEl;
    }
  };

  const handleDragStartTimeLine = (e, item) => {
    const dragEl =
      e?.currentTarget?.closest?.(".time-line-item") ?? e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    activeRowElRef.current = dragEl;
    dragEl.classList.add("dragging");

    if (transparentDragImageRef.current) {
      e.dataTransfer.setDragImage(transparentDragImageRef.current, 0, 0);
    }

    const rect = dragEl.getBoundingClientRect();
    dragOffsetsRef.current = {
      top: e.clientY - rect.top,
      bottom: rect.bottom - e.clientY,
    };
    activeIdRef.current = item.id;
    overIdRef.current = null;
    lastOverElRef.current = null;
    pendingOverIdRef.current = null;
    acceptedOverIdRef.current = null;
    didDropRef.current = false;
    fadeRef.current.maxTravelRatio = 0;
    fadeRef.current.maxFade = 0.6;
    fadeRef.current.lockedHidden = false;
    if (commitRef.current.raf != null) {
      cancelAnimationFrame(commitRef.current.raf);
      commitRef.current.raf = null;
    }
    commitRef.current.scheduled = false;
    commitRef.current.pending = null;

    buildReorderPreviewCache();

    // Drag ghost overlay:
    // - Create a lightweight container immediately (fast dragstart)
    // - Clone the full row in rAF so the dragstart handler doesn't block.
    const parentEl = document.createElement("div");

    const outlineBox = document.createElement("div");
    outlineBox.style.position = "absolute";
    outlineBox.style.inset = "0";
    outlineBox.style.zIndex = zIndexFloors.head + 1;
    outlineBox.style.boxSizing = "border-box";
    outlineBox.style.border = "2px solid rgba(255, 255, 255, 0.85)";
    outlineBox.style.boxShadow = "0 0 0 1px rgba(120, 200, 255, 0.35)";
    outlineBox.style.borderRadius = "6px";
    parentEl.style.backdropFilter = backdropFilter;
    parentEl.style.WebkitBackdropFilter = backdropFilter;

    parentEl.style.pointerEvents = "none";
    // Use fixed positioning so viewport coords from getBoundingClientRect() work
    // no matter where we mount the overlay in the DOM.
    parentEl.style.position = "fixed";
    parentEl.style.zIndex = zIndexFloors.head;
    parentEl.style.left = `${rect.left}px`;
    parentEl.style.top = `${rect.top}px`;
    parentEl.style.width = `${rect.width}px`;
    parentEl.style.height = `${rect.height}px`;

    // Ensure CSS variables used inside cloned markup (e.g. --homeDayPassedXPos) exist
    // even though the ghost is appended outside the Timespace root.
    const sourceEl = cssVarSourceElRef?.current ?? null;
    if (sourceEl) {
      const homeX = sourceEl.style.getPropertyValue("--homeDayPassedXPos");
      if (homeX) {
        parentEl.style.setProperty("--homeDayPassedXPos", homeX);
        lastHomeXCssRef.current = homeX;
      }
    }

    parentEl.appendChild(outlineBox);

    const host =
      portalContainer ?? document.getElementById("content") ?? document.body;
    host.appendChild(parentEl);
    clonedElementRef.current = parentEl;

    // Clone the full row on the next frame (much smoother than doing it in dragstart).
    requestAnimationFrame(() => {
      // Drag could have ended already.
      if (clonedElementRef.current !== parentEl) return;

      try {
        if (!dragEl) return;
        const clonedElement = dragEl.cloneNode(true);
        clonedElement.classList.remove("dragging");
        clonedElement.classList.remove("over");
        // Make sure the clone is visible even if there are local styles.
        clonedElement.style.opacity = "1";

        parentEl.appendChild(clonedElement);
      } catch (err) {
        // If cloning fails for some reason, keep the outline-only overlay.
        // eslint-disable-next-line no-console
        console.warn("Failed to clone dragged timeline element", err);
      }
    });
  };

  const handleDragOverTimeLine = (ev, item) => {
    ev.preventDefault(); // Necessary for allowing to drop
    ev.dataTransfer.dropEffect = "move";

    const activeId = activeIdRef.current;
    if (activeId == null) return;
    if (item?.isLocked) return;

    // Track drop target; do NOT reorder the list during native HTML5 drag
    // (reordering during drag makes native DnD glitchy and expensive).
    overIdRef.current = item.id;
    pendingOverIdRef.current = item.id;
    scheduleReorderPreview();
    // Keep ghost + fade responsive even when we are over a row.
    const listEl = listElRef?.current ?? null;
    if (listEl) {
      const rect = listEl.getBoundingClientRect();
      const y = ev.clientY - rect.top + listEl.scrollTop;
      applyDraggedRowFade({ activeId, overId: item.id, yInList: y });
    }

    if (lastOverElRef.current !== ev.currentTarget) {
      if (lastOverElRef.current) {
        lastOverElRef.current.classList.remove("over");
      }
      ev.currentTarget.classList.add("over");
      lastOverElRef.current = ev.currentTarget;
    }

    // Keep clock line CSS var in sync while dragging (cheap string copy).
    if (clonedElementRef.current && cssVarSourceElRef?.current) {
      const homeX = cssVarSourceElRef.current.style.getPropertyValue(
        "--homeDayPassedXPos",
      );
      if (homeX && lastHomeXCssRef.current !== homeX) {
        clonedElementRef.current.style.setProperty(
          "--homeDayPassedXPos",
          homeX,
        );
        lastHomeXCssRef.current = homeX;
      }
    }

    updateGhostTop(ev.clientY);
  };

  const handleDragEndTimeLine = (e) => {
    // Native DnD can sometimes fail to fire `drop` depending on where the pointer is
    // (especially with gaps). `dragend` always fires, so we use it as a fallback.
    // Only commit if a drop actually occurred (or the browser reports a non-none dropEffect).
    const dropEffect = e?.dataTransfer?.dropEffect ?? null;
    const shouldCommit =
      didDropRef.current || (dropEffect != null && dropEffect !== "none");
    const committed = shouldCommit ? scheduleCommitReorder("dragend") : false;
    debugLog("dragend", {
      dropEffect,
      didDrop: didDropRef.current,
      shouldCommit,
      committed,
      activeId: activeIdRef.current,
      overId: overIdRef.current,
    });

    (activeRowElRef.current ?? e.currentTarget)?.classList.remove("dragging");
    activeRowElRef.current = null;
    if (lastOverElRef.current) {
      lastOverElRef.current.classList.remove("over");
      lastOverElRef.current = null;
    }
    // Ensure no lingering hover styles.
    document
      .querySelectorAll(".time-line-item.over")
      .forEach((el) => el.classList.remove("over"));

    cleanupClone();
    resetReorderPreviewStyles({ activeId: activeIdRef.current });
    pendingOverIdRef.current = null;
    acceptedOverIdRef.current = null;
    if (rafPreviewRef.current != null) {
      cancelAnimationFrame(rafPreviewRef.current);
      rafPreviewRef.current = null;
    }

    activeIdRef.current = null;
    overIdRef.current = null;
    dragOffsetsRef.current = { top: null, bottom: null };
    lastHomeXCssRef.current = null;

    // If we didn't commit (no valid drop), preserve previous behavior.
    if (!committed && onSetTimelinesOrder) onSetTimelinesOrder();
  };

  const handleDropTimeLine = (ev) => {
    if (ev?.preventDefault) ev.preventDefault();
    didDropRef.current = true;
    const committed = scheduleCommitReorder("drop");
    debugLog("drop", {
      committed,
      activeId: activeIdRef.current,
      overId: overIdRef.current,
    });

    // Cleanup preview visuals; actual reorder commit is deferred.
    overIdRef.current = null;
    lastHomeXCssRef.current = null;
    pendingOverIdRef.current = null;
    acceptedOverIdRef.current = null;
    resetReorderPreviewStyles({ activeId: activeIdRef.current });
  };

  return {
    transparentDragImageRef,
    handleDragStartTimeLine,
    handleDragTimeLine,
    handleDragOverTimeLineList,
    handleDragEndTimeLine,
    handleDropTimeLine,
  };
}
