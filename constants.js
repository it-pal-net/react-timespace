// Shared layout constants for the Timespace timeline components.

export const labelTailHeight = 40;
export const clockXTransformPercent = 10;

const basementFloor = 90;
const baseFloor = 100;
const headFloor = 200;

export const zIndexFloors = {
  basement: basementFloor,
  base: baseFloor,
  // A locked (sticky) timeline row must sit above its unlocked siblings.
  lockedRow: baseFloor + 1,
  head: headFloor,
  // Marker tails render above head-level labels so the rounded caps stay visible.
  markerTail: headFloor + 10,
};

export const backdropFilter = "blur(30px)";

// Time intervals have up to two draggable points; most marker/clock UI is
// rendered once per present point.
export const intervalPosKeys = ["xPos1", "xPos2"];
