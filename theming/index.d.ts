// Types for the `react-timespace/theming` subpath.
//
// This entry point exists for linked checkouts and monorepos — the published
// tarball exposes only `.` and `./theme-config`. Everything shared is declared
// in the root index.d.ts; only the theming-only helpers are declared here.

import type { ThemeMode, ThemePreset, TimespaceTheme } from "../index";

export type {
  ThemeMode,
  ThemePreset,
  ThemePresetMode,
  ThemeBackground,
  ThemePreviewContextValue,
  TimespaceTheme,
  TimespaceThemeProviderProps,
} from "../index";

export {
  themePresets,
  colorLabels,
  TimespaceThemeProvider,
  ThemePreviewContext,
  useThemePreview,
  resolveTheme,
  defaultTimespaceTheme,
} from "../index";

export declare const DEFAULT_FONT: string;

export interface ComposeThemeOptions {
  themes?: Record<string, ThemePreset>;
  themeName?: string;
  localThemes?: Record<string, ThemePreset>;
  /** The unsaved draft, as stored under the `newTheme` localStorage key. */
  newTheme?: Record<string, unknown> | null;
  mode?: ThemeMode;
  previewThemeName?: string | null;
  previewFont?: string | null;
  defaultFont?: string;
}

/**
 * Pure core of `TimespaceThemeProvider`: merges a preset (or saved local
 * theme) with the unsaved draft and the hover previews.
 */
export declare function composeTheme(options: ComposeThemeOptions): TimespaceTheme;

/** Fills in any theme keys the Timespace components need but `outerTheme` omits. */
export declare function withThemeDefaults(
  outerTheme: Partial<TimespaceTheme> | null | undefined,
): TimespaceTheme;

/** Recursive merge; `obj2` wins on conflicts. Neither input is mutated. */
export declare function deepMerge<A extends object, B extends object>(
  obj1: A,
  obj2: B,
): A & B;
