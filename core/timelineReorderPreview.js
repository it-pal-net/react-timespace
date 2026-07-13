export function moveItem(list, from, to) {
  if (!Array.isArray(list)) return [];
  if (from === to) return list.slice();
  if (from < 0 || to < 0) return list.slice();
  if (from >= list.length || to >= list.length) return list.slice();
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function getPreviewOrderIds({ orderIds, activeId, overId }) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) return null;
  if (!activeId || !overId) return null;
  const from = orderIds.indexOf(activeId);
  const to = orderIds.indexOf(overId);
  if (from === -1 || to === -1) return null;
  if (from === to) return orderIds.slice();
  return moveItem(orderIds, from, to);
}

export function getReorderPreviewDeltas({
  originalOrderIds,
  previewOrderIds,
  topById,
}) {
  if (!Array.isArray(originalOrderIds) || originalOrderIds.length === 0) {
    return {};
  }
  if (!Array.isArray(previewOrderIds) || previewOrderIds.length === 0) {
    return {};
  }
  const getTop = (id) => {
    if (!topById) return null;
    if (topById instanceof Map) return topById.get(id) ?? null;
    return topById[id] ?? null;
  };

  const topsBySlot = originalOrderIds.map((id) => getTop(id));
  const nextIndexById = new Map();
  previewOrderIds.forEach((id, idx) => nextIndexById.set(id, idx));

  return originalOrderIds.reduce((acc, id) => {
    const oldTop = getTop(id);
    const nextIndex = nextIndexById.get(id);
    const newTop = typeof nextIndex === "number" ? topsBySlot[nextIndex] : null;
    if (oldTop == null || newTop == null) {
      acc[id] = 0;
      return acc;
    }
    acc[id] = newTop - oldTop;
    return acc;
  }, {});
}

export function findOverIdByPointerY({
  orderIds,
  activeId,
  y,
  topById,
  heightById,
  lockedIds,
}) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) return null;
  if (typeof y !== "number") return null;

  const isLocked = (id) =>
    lockedIds instanceof Set ? lockedIds.has(id) : false;

  const candidates = orderIds.filter(
    (id) => id && id !== activeId && !isLocked(id),
  );
  if (!candidates.length) return null;

  const getTop = (id) => {
    if (!topById) return null;
    if (topById instanceof Map) return topById.get(id) ?? null;
    return topById[id] ?? null;
  };
  const getHeight = (id) => {
    if (!heightById) return null;
    if (heightById instanceof Map) return heightById.get(id) ?? null;
    return heightById[id] ?? null;
  };

  // Prefer the element whose bounds contain the pointer Y (best "what I'm over" signal).
  for (const id of candidates) {
    const top = getTop(id);
    const h = getHeight(id);
    if (top == null || h == null) continue;
    const bottom = top + h;
    if (y >= top && y <= bottom) return id;
  }

  // If we're in a gap, pick the nearest element by distance to its midpoint.
  let bestId = null;
  let bestDist = Infinity;
  for (const id of candidates) {
    const top = getTop(id);
    const h = getHeight(id);
    if (top == null || h == null) continue;
    const mid = top + h / 2;
    const dist = Math.abs(y - mid);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = id;
    }
  }
  return bestId;
}
