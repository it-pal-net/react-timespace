import { describe, expect, it } from "vitest";

import {
  calculateAvailabilityGrid,
  isMinuteAvailable,
  normalizeAvailability,
} from "../availability";

describe("availability", () => {
  it("normalizes one or multiple HH:mm ranges", () => {
    expect(normalizeAvailability({ start: "08:00", end: "21:00" })).toEqual([
      { start: 480, end: 1260 },
    ]);
    expect(
      normalizeAvailability([
        { start: "09:30", end: "12:00" },
        { start: "invalid", end: "18:00" },
      ]),
    ).toEqual([{ start: 570, end: 720 }]);
  });

  it("supports overnight and full-day ranges", () => {
    const overnight = normalizeAvailability({ start: "22:00", end: "06:00" });
    expect(isMinuteAvailable(overnight, 23 * 60)).toBe(true);
    expect(isMinuteAvailable(overnight, 5 * 60 + 59)).toBe(true);
    expect(isMinuteAvailable(overnight, 12 * 60)).toBe(false);

    const fullDay = normalizeAvailability({ start: "00:00", end: "00:00" });
    expect(isMinuteAvailable(fullDay, 12 * 60)).toBe(true);
  });

  it("maps availability and common overlap onto the home timeline", () => {
    const grid = calculateAvailabilityGrid(
      [
        {
          id: "utc",
          timeZone: "Etc/UTC",
          availability: { start: "08:00", end: "10:00" },
        },
        {
          id: "berlin",
          timeZone: "Europe/Berlin",
          availability: { start: "09:00", end: "11:00" },
        },
      ],
      "Etc/UTC",
      new Date("2026-01-15T12:00:00Z"),
    );

    expect(grid.utc[8].available).toEqual([{ start: 0, end: 1 }]);
    expect(grid.berlin[8].available).toEqual([{ start: 0, end: 1 }]);
    expect(grid.utc[8].overlap).toEqual([{ start: 0, end: 1 }]);
    expect(grid.utc[10].overlap).toEqual([]);
  });

  it("only highlights overlap shared by every configured timeline", () => {
    const grid = calculateAvailabilityGrid(
      [
        {
          id: "morning-a",
          timeZone: "Etc/UTC",
          availability: { start: "08:00", end: "12:00" },
        },
        {
          id: "morning-b",
          timeZone: "Etc/UTC",
          availability: { start: "10:00", end: "14:00" },
        },
        {
          id: "evening",
          timeZone: "Etc/UTC",
          availability: { start: "18:00", end: "20:00" },
        },
      ],
      "Etc/UTC",
      new Date("2026-01-15T12:00:00Z"),
    );

    expect(grid["morning-a"][10].overlap).toEqual([]);
    expect(grid["morning-b"][10].overlap).toEqual([]);
    expect(grid.evening[10].overlap).toEqual([]);
    expect(grid["morning-a"][9].overlap).toEqual([]);
  });
});
