import { useMemo, useState, useCallback } from "react";
import { ThemeProvider } from "@emotion/react";
import PropTypes from "prop-types";

import useLocalStorage from "../hooks/useLocalStorage";
import themePresets from "./themes";
import composeTheme, { DEFAULT_FONT } from "./composeTheme";
import { ThemePreviewContext } from "./ThemePreviewContext";

// localStorage-backed theme provider. Persists the selected preset, mode,
// user-saved themes and the unsaved draft under the keys `themeName`,
// `themeMode`, `localThemes` and `newTheme`, and exposes hover-preview state
// (theme + font) through ThemePreviewContext for the configurator.
function TimespaceThemeProvider({
  children,
  themes = themePresets,
  forceThemeMode,
  defaultFont = DEFAULT_FONT,
}) {
  const [themeName] = useLocalStorage("themeName", "default");
  const [previewThemeName, setPreviewThemeName] = useState(null);
  const [previewFont, setPreviewFont] = useState(null);
  const [themeMode] = useLocalStorage("themeMode", forceThemeMode ?? "dark");
  const mode = forceThemeMode ?? themeMode;

  const [localThemes] = useLocalStorage("localThemes", {});

  const [newThemeRaw] = useLocalStorage("newTheme", null);
  const newTheme = useMemo(
    () => (newThemeRaw ? JSON.parse(newThemeRaw) : null),
    [newThemeRaw],
  );

  const { theme, committedFont } = composeTheme({
    themes,
    themeName,
    localThemes,
    newTheme,
    mode,
    previewThemeName,
    previewFont,
    defaultFont,
  });

  const clearPreviewThemeName = useCallback(
    () => setPreviewThemeName(null),
    [],
  );

  const clearPreviewFont = useCallback(() => setPreviewFont(null), []);

  return (
    <ThemePreviewContext.Provider
      value={{
        themes,
        previewThemeName,
        setPreviewThemeName,
        clearPreviewThemeName,
        committedFont,
        previewFont,
        setPreviewFont,
        clearPreviewFont,
      }}
    >
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemePreviewContext.Provider>
  );
}

TimespaceThemeProvider.propTypes = {
  children: PropTypes.node,
  themes: PropTypes.object,
  forceThemeMode: PropTypes.oneOf(["light", "dark"]),
  defaultFont: PropTypes.string,
};

export default TimespaceThemeProvider;
