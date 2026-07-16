import { describe, it, expect } from "vitest";

import composeTheme, { DEFAULT_FONT } from "../composeTheme";
import resolveTheme from "../resolveTheme";
import themePresets from "../themes";

describe("composeTheme", () => {
  it("flattens a preset for the requested mode", () => {
    const { theme, committedFont } = composeTheme({
      themeName: "dracula",
      mode: "light",
    });

    expect(theme.name).toBe("dracula");
    expect(theme.mode).toBe("light");
    expect(theme.color).toEqual(themePresets.dracula.light.color);
    expect(theme.size).toEqual(themePresets.dracula.size);
    expect(theme.original).toBe(themePresets.dracula);
    expect(theme.uiScale).toBe(1);
    expect(committedFont).toBe(DEFAULT_FONT);
  });

  it("falls back to the default preset for unknown names", () => {
    const { theme } = composeTheme({ themeName: "nope", mode: "dark" });
    expect(theme.original).toBe(themePresets.default);
  });

  it("overlays the newTheme draft on colors, sizes, font and uiScale", () => {
    const { theme, committedFont } = composeTheme({
      themeName: "default",
      mode: "dark",
      newTheme: {
        font: "Kode Mono",
        uiScale: 1.5,
        size: { clockHand: 4 },
        dark: { color: { intervalHandBody: "#123456" } },
      },
    });

    expect(theme.font).toBe("Kode Mono");
    expect(committedFont).toBe("Kode Mono");
    expect(theme.uiScale).toBe(1.5);
    expect(theme.size.clockHand).toBe(4);
    expect(theme.size.borderHour).toBe(themePresets.default.size.borderHour);
    expect(theme.color.intervalHandBody).toBe("#123456");
    expect(theme.color.clockHandBody).toBe(
      themePresets.default.dark.color.clockHandBody,
    );
  });

  it("prefers preview theme and font over committed values", () => {
    const { theme, committedFont } = composeTheme({
      themeName: "default",
      mode: "dark",
      newTheme: { font: "Kode Mono" },
      previewThemeName: "nord",
      previewFont: "Workbench",
    });

    expect(theme.name).toBe("nord");
    expect(theme.original).toBe(themePresets.nord);
    expect(theme.font).toBe("Workbench");
    expect(committedFont).toBe("Kode Mono");
  });

  it("resolves user-saved local themes", () => {
    const localTheme = {
      ...themePresets.default,
      name: "mine",
      type: "localTheme",
    };
    const { theme } = composeTheme({
      themeName: "mine",
      localThemes: { mine: localTheme },
      mode: "dark",
    });

    expect(theme.original).toBe(localTheme);
    expect(theme.type).toBe("localTheme");
  });
});

describe("resolveTheme", () => {
  it("resolves preset names to a flat widget theme", () => {
    const theme = resolveTheme("dracula", { mode: "light" });
    expect(theme.mode).toBe("light");
    expect(theme.color).toEqual(themePresets.dracula.light.color);
    expect(theme.size).toEqual(themePresets.dracula.size);
  });

  it("returns null for unknown names and empty input", () => {
    expect(resolveTheme("nope")).toBeNull();
    expect(resolveTheme(null)).toBeNull();
  });

  it("flattens preset-shaped objects and passes flat themes through", () => {
    const preset = resolveTheme(themePresets.nord, { mode: "dark" });
    expect(preset.color).toEqual(themePresets.nord.dark.color);

    const flat = resolveTheme({ color: { intervalHandBody: "#fff" } });
    expect(flat.mode).toBe("dark");
    expect(flat.color.intervalHandBody).toBe("#fff");
  });
});
