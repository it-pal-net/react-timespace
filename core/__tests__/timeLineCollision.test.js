import { describe, expect, it } from "vitest";

import resolveTimeLineCollisions from "../timeLineCollision";

function makeSize(overrides = {}) {
  return {
    leftOffset: 0,
    leftListOffset: 0,
    hoursLineWidth: 1000,
    maxHeaderWidth: 200,
    timeZonesClockWidth: 100,
    timeIntervalClockWidth: 100,
    ...overrides,
  };
}

describe("core/timeLineCollision", () => {
  it("prefers the right side for non-header clocks when possible", () => {
    const fixed = resolveTimeLineCollisions({
      timeInterval: {
        id: "ti-1",
        xPos1: 200,
        xPos2: null,
        xPos1ClockSide: "left",
        xPos2ClockSide: "right",
      },
      timeZonesClock: { side: "left" },
      timeLineName: { side: "left" },
      size: makeSize(),
      homeDayPassedXPos: 500,
      clockXTransformPercent: 0,
    });

    const xPos1 = fixed.find(
      (i) => i.type === "timeInterval" && i.pointName === "xPos1",
    );
    const tzClock = fixed.find((i) => i.type === "timeZonesClock");
    const name = fixed.find((i) => i.type === "timeLineName");

    expect(xPos1).toBeTruthy();
    expect(tzClock).toBeTruthy();
    expect(name).toBeTruthy();

    expect(xPos1.side).toBe("right");
    expect(tzClock.side).toBe("right");
    // header block keeps its chosen side (special-cased)
    expect(name.side).toBe("left");
  });

  it("switches to left when a clock would overflow the right boundary", () => {
    const fixed = resolveTimeLineCollisions({
      timeInterval: {
        id: "ti-1",
        xPos1: 980, // right-side clock would overflow
        xPos2: null,
        xPos1ClockSide: "right",
        xPos2ClockSide: "right",
      },
      timeZonesClock: { side: "right" },
      timeLineName: { side: "left" },
      size: makeSize(),
      homeDayPassedXPos: 500,
      clockXTransformPercent: 0,
    });

    const xPos1 = fixed.find(
      (i) => i.type === "timeInterval" && i.pointName === "xPos1",
    );
    expect(xPos1).toBeTruthy();
    expect(xPos1.end).toBeLessThanOrEqual(1000);
    // to avoid overflow, the algorithm should have moved it to the left side
    expect(xPos1.side).toBe("left");
  });

  it("treats homeDayPassedXPos as viewport coords (does not double-add leftListOffset)", () => {
    const fixed = resolveTimeLineCollisions({
      timeInterval: null,
      timeZonesClock: { side: "right" },
      timeLineName: { side: "left" },
      size: makeSize({
        leftOffset: 10,
        leftListOffset: 123,
        hoursLineWidth: 1000,
      }),
      homeDayPassedXPos: 500,
      clockXTransformPercent: 0,
    });

    const tzClock = fixed.find((i) => i.type === "timeZonesClock");
    expect(tzClock).toBeTruthy();
    expect(tzClock.start).toBe(500);
    expect(tzClock.end).toBe(600);
  });

  it("includes both endpoints from every interval", () => {
    const fixed = resolveTimeLineCollisions({
      timeIntervals: [
        {
          id: "ti-1",
          xPos1: 250,
          xPos2: 450,
          xPos1ClockSide: "right",
          xPos2ClockSide: "right",
        },
        {
          id: "ti-2",
          xPos1: 650,
          xPos2: 850,
          xPos1ClockSide: "right",
          xPos2ClockSide: "right",
        },
      ],
      timeZonesClock: { side: "right" },
      timeLineName: { side: "left" },
      size: makeSize({ maxHeaderWidth: 100 }),
      homeDayPassedXPos: 550,
      clockXTransformPercent: 0,
    });

    const intervalPoints = fixed
      .filter((item) => item.type === "timeInterval")
      .map(({ intervalId, pointName }) => `${intervalId}:${pointName}`);

    expect(intervalPoints).toEqual([
      "ti-1:xPos1",
      "ti-1:xPos2",
      "ti-2:xPos1",
      "ti-2:xPos2",
    ]);
  });

  it("assigns different stack lanes to labels from different intervals when neither can move aside", () => {
    const fixed = resolveTimeLineCollisions({
      timeIntervals: ["ti-1", "ti-2", "ti-3"].map((id) => ({
        id,
        xPos1: 400,
        xPos2: null,
        xPos1ClockSide: "right",
        xPos2ClockSide: "right",
      })),
      timeZonesClock: { side: "right" },
      timeLineName: { side: "left" },
      size: makeSize({ maxHeaderWidth: 100 }),
      homeDayPassedXPos: 750,
      clockXTransformPercent: 0,
    });

    const intervalPoints = fixed.filter(
      (item) => item.type === "timeInterval",
    );
    const collidedPoints = intervalPoints.filter(
      (item) => item.collisionIndexes.length > 0,
    );

    expect(collidedPoints).toHaveLength(2);
    expect(new Set(collidedPoints.map((item) => item.intervalId))).toEqual(
      new Set(["ti-2", "ti-3"]),
    );
    expect(collidedPoints[0].stackSize).toBe(2);
    expect(collidedPoints[1].stackSize).toBe(2);
    expect(collidedPoints[0].stackIndex).not.toBe(
      collidedPoints[1].stackIndex,
    );
    fixed.forEach((item) => {
      item.collisionIndexes.forEach((otherIndex) => {
        expect(item.stackIndex).not.toBe(fixed[otherIndex].stackIndex);
      });
    });
  });
});
