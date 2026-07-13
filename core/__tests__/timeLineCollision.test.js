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
});
