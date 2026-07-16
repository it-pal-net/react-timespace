import { createContext, useContext } from "react";

export const ThemePreviewContext = createContext(null);

export function useThemePreview() {
  const ctx = useContext(ThemePreviewContext);

  // Safe no-ops if used outside provider.
  if (!ctx) {
    return {
      themes: null,
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
