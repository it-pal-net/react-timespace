import themePresets from "./themes";

export const DEFAULT_FONT = "Montserrat:wght@400";

// Pure core of TimespaceThemeProvider: merges a preset (or saved local theme)
// with the unsaved draft (`newTheme`) and the hover previews into the flat
// theme object the Timespace components and the configurator read.
export default function composeTheme({
  themes = themePresets,
  themeName = "default",
  localThemes = {},
  newTheme = null,
  mode = "dark",
  previewThemeName = null,
  previewFont = null,
  defaultFont = DEFAULT_FONT,
}) {
  const effectiveThemeName = previewThemeName ?? themeName;
  const themeData =
    themes[effectiveThemeName] ??
    localThemes[effectiveThemeName] ??
    themes.default;

  const committedFont = newTheme?.font ?? themeData.font ?? defaultFont;

  const themeModeData = {
    ...themeData[mode],
    ...(newTheme?.[mode] ?? {}),
    type: themeData.type,
    size: {
      ...themeData.size,
      ...(newTheme?.size ?? {}),
    },
    color: {
      ...themeData[mode].color,
      ...(newTheme?.[mode]?.color ?? {}),
    },
    font: previewFont ?? committedFont,
    uiScale: Number(newTheme?.uiScale ?? themeData.uiScale ?? 1),
  };

  return {
    theme: {
      name: effectiveThemeName,
      mode,
      newTheme,
      original: themeData,
      ...themeModeData,
    },
    committedFont,
  };
}
