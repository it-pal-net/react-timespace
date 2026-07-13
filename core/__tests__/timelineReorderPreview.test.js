import { describe, expect, it } from "vitest";

import {
  getPreviewOrderIds,
  getReorderPreviewDeltas,
  findOverIdByPointerY,
} from "../timelineReorderPreview";

describe("core/timelineReorderPreview", () => {
  it("computes preview order with the same splice semantics as drop", () => {
    const orderIds = ["A", "B", "C"];
    // Drag A over C => [B, C, A]
    expect(
      getPreviewOrderIds({ orderIds, activeId: "A", overId: "C" }),
    ).toEqual(["B", "C", "A"]);
    // Drag C over A => [C, A, B]
    expect(
      getPreviewOrderIds({ orderIds, activeId: "C", overId: "A" }),
    ).toEqual(["C", "A", "B"]);
  });

  it("computes transform deltas so items animate into their preview slots", () => {
    const originalOrderIds = ["A", "B", "C"];
    const previewOrderIds = ["B", "C", "A"]; // A dragged over C
    const topById = new Map([
      ["A", 0],
      ["B", 10],
      ["C", 20],
    ]);

    const deltas = getReorderPreviewDeltas({
      originalOrderIds,
      previewOrderIds,
      topById,
    });

    // In preview, B moves to slot 0 (top 0), C to slot 1 (top 10), A to slot 2 (top 20)
    expect(deltas.B).toBe(-10);
    expect(deltas.C).toBe(-10);
    expect(deltas.A).toBe(20);
  });

  it("finds an overId by pointer Y even when the cursor is between rows", () => {
    const orderIds = ["A", "B", "C"];
    const topById = new Map([
      ["A", 0],
      ["B", 100],
      ["C", 200],
    ]);
    const heightById = new Map([
      ["A", 50],
      ["B", 50],
      ["C", 50],
    ]);

    // y is in the gap between A and B -> should pick B (closest below midpoints)
    expect(
      findOverIdByPointerY({
        orderIds,
        activeId: "A",
        y: 80,
        topById,
        heightById,
      }),
    ).toBe("B");

    // y is inside B -> should pick B
    expect(
      findOverIdByPointerY({
        orderIds,
        activeId: "A",
        y: 120,
        topById,
        heightById,
      }),
    ).toBe("B");
  });
});
