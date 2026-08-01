import { describe, expect, it } from "vitest";

import {
  addPercentShift,
  calculateDurationData,
  calculateFontSize,
  calculateTopOffset,
  formatDeltaToLocal,
  getBoundaryPositions,
  getPanCommitDayDelta,
  getSecondsFromStartOfDay,
  getStartOfZonedDayUtcMs,
  getTimeZoneOffsetSecondsSafe,
  getViewDayStartUtcMs,
  getXPosFromDayOffset,
  MILLISECONDS_IN_DAY,
  PAN_COMMIT_REMAINDER_HOURS,
  SECONDS_IN_DAY,
} from "../timeLineMath";

function makeSize(overrides = {}) {
  return {
    hoursLineWidth: 1200,
    leftOffset: 50,
    leftListOffset: 20,
    ...overrides,
  };
}

describe("core/timeLineMath", () => {
  it("addPercentShift shifts by percent", () => {
    expect(addPercentShift(10, 100)).toBe(110);
    expect(addPercentShift(-10, 100)).toBe(90);
  });

  it("getBoundaryPositions returns correct start/end for left/right", () => {
    expect(getBoundaryPositions(50, 10, true)).toEqual({
      start: 40,
      end: 50,
      width: 10,
    });
    expect(getBoundaryPositions(50, 10, false)).toEqual({
      start: 50,
      end: 60,
      width: 10,
    });
  });

  it("calculateTopOffset returns 2 offsets for 2 elements", () => {
    const [a, b] = calculateTopOffset(100, 50, 2);
    expect(typeof a).toBe("number");
    expect(typeof b).toBe("number");
    expect(a).not.toBe(b);
  });

  it("calculateFontSize decreases as number of elements grows", () => {
    const f2 = calculateFontSize(100, 2);
    const f3 = calculateFontSize(100, 3);
    expect(f3).toBeLessThan(f2);
  });

  it("calculateDurationData computes pixels/seconds and midpoint", () => {
    const hoursLineWidth = 1000;
    const xPos1 = 0;
    const xPos2 = 1000;
    const data = calculateDurationData({
      xPos1,
      xPos2,
      hoursLineWidth,
    });
    expect(data.durationPixels).toBe(1000);
    expect(data.durationSeconds).toBe(MILLISECONDS_IN_DAY / 1000);
    expect(data.arrowMidPoint).toBe(500);
    expect(typeof data.durationHuman).toBe("string");
  });

  it("calculateDurationData returns empty object when a point is missing", () => {
    expect(
      calculateDurationData({
        xPos1: 1,
        xPos2: null,
        hoursLineWidth: 1000,
      }),
    ).toEqual({});
  });

  describe("formatDeltaToLocal", () => {
    it("returns null for missing or invalid input", () => {
      expect(formatDeltaToLocal(null)).toBe(null);
      expect(formatDeltaToLocal(undefined)).toBe(null);
      expect(formatDeltaToLocal(NaN)).toBe(null);
    });

    it("returns 0h for zero delta", () => {
      expect(formatDeltaToLocal(0)).toBe("0h");
    });

    it("formats whole-hour deltas", () => {
      expect(formatDeltaToLocal(3600)).toBe("+1h");
      expect(formatDeltaToLocal(-7200)).toBe("-2h");
    });

    it("formats sub-hour deltas as minutes only", () => {
      expect(formatDeltaToLocal(30 * 60)).toBe("+30m");
      expect(formatDeltaToLocal(-45 * 60)).toBe("-45m");
    });

    it("formats mixed hour-and-minute deltas", () => {
      // e.g. India (UTC+05:30) relative to UTC
      expect(formatDeltaToLocal(5.5 * 3600)).toBe("+5h30m");
      expect(formatDeltaToLocal(-9.75 * 3600)).toBe("-9h45m");
    });

    it("rounds away float noise", () => {
      expect(formatDeltaToLocal(3600.4)).toBe("+1h");
    });
  });

  describe("getTimeZoneOffsetSecondsSafe", () => {
    it("returns null without a time zone", () => {
      expect(getTimeZoneOffsetSecondsSafe(null)).toBe(null);
      expect(getTimeZoneOffsetSecondsSafe("")).toBe(null);
    });

    it("returns 0 for UTC", () => {
      expect(getTimeZoneOffsetSecondsSafe("Etc/UTC")).toBe(0);
    });

    it("resolves fixed offsets for DST-free zones", () => {
      // Asia/Kolkata is UTC+05:30 year-round.
      expect(getTimeZoneOffsetSecondsSafe("Asia/Kolkata")).toBe(
        5 * 3600 + 30 * 60,
      );
      // Asia/Tokyo is UTC+09:00 year-round.
      expect(getTimeZoneOffsetSecondsSafe("Asia/Tokyo")).toBe(9 * 3600);
    });

    it("respects the provided date for DST zones", () => {
      // Berlin: CET (+1h) in January, CEST (+2h) in July.
      expect(
        getTimeZoneOffsetSecondsSafe(
          "Europe/Berlin",
          new Date("2026-01-15T12:00:00Z"),
        ),
      ).toBe(3600);
      expect(
        getTimeZoneOffsetSecondsSafe(
          "Europe/Berlin",
          new Date("2026-07-15T12:00:00Z"),
        ),
      ).toBe(7200);
    });
  });

  describe("getXPosFromDayOffset", () => {
    it("returns null for a missing offset", () => {
      expect(getXPosFromDayOffset(null, makeSize())).toBe(null);
      expect(getXPosFromDayOffset(undefined, makeSize())).toBe(null);
    });

    it("maps the start and middle of the day onto the hours line", () => {
      const size = makeSize();
      expect(getXPosFromDayOffset(0, size)).toBe(
        size.leftOffset + size.leftListOffset,
      );
      expect(getXPosFromDayOffset(SECONDS_IN_DAY / 2, size)).toBe(
        size.hoursLineWidth / 2 + size.leftOffset + size.leftListOffset,
      );
    });
  });

  describe("getStartOfZonedDayUtcMs", () => {
    it("finds midnight of the zone's calendar day", () => {
      // 2026-07-15T22:30Z is already July 16 in Tokyo (UTC+9).
      const date = new Date("2026-07-15T22:30:00Z");
      expect(getStartOfZonedDayUtcMs("Etc/UTC", date)).toBe(
        Date.parse("2026-07-15T00:00:00Z"),
      );
      expect(getStartOfZonedDayUtcMs("Asia/Tokyo", date)).toBe(
        Date.parse("2026-07-15T15:00:00Z"),
      );
    });
  });

  describe("getViewDayStartUtcMs", () => {
    const baseDate = new Date("2026-07-15T10:00:00Z");

    it("returns the same day's start for offset 0", () => {
      expect(getViewDayStartUtcMs("Etc/UTC", baseDate, 0)).toBe(
        Date.parse("2026-07-15T00:00:00Z"),
      );
    });

    it("shifts by whole days in both directions", () => {
      expect(getViewDayStartUtcMs("Etc/UTC", baseDate, 1)).toBe(
        Date.parse("2026-07-16T00:00:00Z"),
      );
      expect(getViewDayStartUtcMs("Etc/UTC", baseDate, -3)).toBe(
        Date.parse("2026-07-12T00:00:00Z"),
      );
    });

    it("stays day-aligned across a 23-hour DST day", () => {
      // Berlin springs forward on 2026-03-29: that day is 23 hours long.
      const beforeTransition = new Date("2026-03-28T12:00:00Z");
      // 2026-03-28 starts at 23:00Z (CET, +1); 2026-03-30 at 22:00Z (CEST, +2).
      expect(getViewDayStartUtcMs("Europe/Berlin", beforeTransition, 0)).toBe(
        Date.parse("2026-03-27T23:00:00Z"),
      );
      expect(getViewDayStartUtcMs("Europe/Berlin", beforeTransition, 2)).toBe(
        Date.parse("2026-03-29T22:00:00Z"),
      );
    });
  });

  describe("getPanCommitDayDelta", () => {
    it("springs back below the remainder threshold", () => {
      expect(getPanCommitDayDelta(0)).toBe(0);
      expect(getPanCommitDayDelta(PAN_COMMIT_REMAINDER_HOURS - 1)).toBe(0);
      expect(getPanCommitDayDelta(-(PAN_COMMIT_REMAINDER_HOURS - 1))).toBe(0);
    });

    it("pages one day past the threshold", () => {
      expect(getPanCommitDayDelta(PAN_COMMIT_REMAINDER_HOURS)).toBe(1);
      expect(getPanCommitDayDelta(-PAN_COMMIT_REMAINDER_HOURS)).toBe(-1);
      expect(getPanCommitDayDelta(23)).toBe(1);
    });

    it("keeps every full day-width dragged", () => {
      expect(getPanCommitDayDelta(24)).toBe(1);
      expect(getPanCommitDayDelta(50)).toBe(2);
      expect(getPanCommitDayDelta(55)).toBe(3);
      expect(getPanCommitDayDelta(-55)).toBe(-3);
    });

    it("lets a flick page without the distance", () => {
      expect(getPanCommitDayDelta(2, 1)).toBe(1);
      expect(getPanCommitDayDelta(-2, -1)).toBe(-1);
      expect(getPanCommitDayDelta(26, 1)).toBe(2);
    });

    it("ignores the flick once the threshold decided", () => {
      expect(getPanCommitDayDelta(23, -1)).toBe(1);
    });
  });

  describe("getSecondsFromStartOfDay", () => {
    it("is the inverse of getXPosFromDayOffset", () => {
      const size = makeSize();
      const secondsIn = 9.5 * 3600;
      const xPos = getXPosFromDayOffset(secondsIn, size);
      expect(getSecondsFromStartOfDay(xPos, size)).toBeCloseTo(secondsIn, 6);
    });

    it("tolerates a missing leftListOffset", () => {
      const size = makeSize({ leftListOffset: undefined });
      expect(getSecondsFromStartOfDay(size.leftOffset, size)).toBe(0);
    });
  });
});
