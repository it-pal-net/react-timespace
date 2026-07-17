import { createContext, useContext } from "react";

export const ThemePreviewContext = createContext(null);

export function useThemePreview() {
  const ctx = useContext(ThemePreviewContext);

  // Safe no-ops if used outside provider.
  if (!ctx) {
    return {
      themes: null,
      // What a provider falls back to while the user has stored no choice of
      // their own. A provider may derive these from its surroundings, so they
      // can change after mount and must not be read only once.
      defaultThemeName: "default",
      defaultThemeMode: "dark",
      previewThemeName: null,
      setPreviewThemeName: () => {},
      clearPreviewThemeName: () => {},
      committedFont: null,
      previewFont: null,
      setPreviewFont: () => {},
      clearPreviewFont: () => {},
    };
  }

  return ctx;
}
