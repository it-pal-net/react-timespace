// Public types for react-timespace/theme-config.
//
// Deliberately free of relative imports into the package: the build flattens
// this file to dist/theme-config.d.ts, where `../index` would not resolve.

import type { ComponentType, MutableRefObject } from "react";
import type { Theme } from "@emotion/react";

export type ThemeConfigMode = "light" | "dark";

/**
 * Host-app component slots. Background gradient and image fills are only
 * offered when the matching slot is supplied.
 */
export interface ThemeConfigComponents {
  Select?: ComponentType<any>;
  Input?: ComponentType<any>;
  GradientPicker?: ComponentType<any>;
  ImagePicker?: ComponentType<any>;
}

export interface ThemeConfigProps {
  /** Hide presets from the picker. */
  excludedThemeNames?: string[];
  /** Show the Time Zones appearance tab (sizing, marker and color controls). */
  showTimespaceRenderingControls?: boolean;
  /**
   * Drop the App/Time Zones/Background tab bar and stack every section as one
   * flat labelled scroll.
   */
  showTabs?: boolean;
  /** Color keys to hide from the color rows. */
  excludedColorKeys?: string[];
  components?: ThemeConfigComponents;
  /** Labels for extra color keys your themes carry, merged over the defaults. */
  colorLabels?: Record<string, string>;
}

/** The full theme editor. Opt-in — never bundled unless you import it. */
export declare const ThemeConfig: ComponentType<ThemeConfigProps>;
export default ThemeConfig;

export interface ThemeOption {
  value: string;
  label: string;
}

export interface ThemeOptionGroup {
  label: string;
  options: ThemeOption[];
}

export interface UseThemeConfigStateOptions {
  excludedThemeNames?: string[];
  showTimespaceRenderingControls?: boolean;
  excludedColorKeys?: string[];
}

/**
 * Everything {@link ThemeConfig} renders from — exported so a host app can
 * build its own editor UI on the same state.
 */
export interface ThemeConfigState {
  theme: Theme;
  themeMode: ThemeConfigMode;
  activeTab: string;
  copiedHexKey: string | null;
  showThemeNameInput: boolean;
  newThemeName: string;
  showPresetMenu: boolean;
  menuRef: MutableRefObject<HTMLElement | null>;
  showTimespaceRenderingControls: boolean;

  /** Color keys split between the App and Time Zones sections. */
  appThemeColorKeys: string[];
  timespaceThemeColorKeys: string[];
  themesOptions: ThemeOptionGroup[];
  selectedThemeOption: ThemeOption;

  /** Whether the unsaved draft touched each section. */
  hasGlobalChanges: boolean;
  hasAppBasicsChanges: boolean;
  hasAppColorsChanges: boolean;
  hasTimelineChanges: boolean;
  hasMarkerChanges: boolean;
  hasTimespaceColorsChanges: boolean;
  hasBackgroundChanges: boolean;

  setActiveTab: (tab: string) => void;
  setThemeMode: (mode: ThemeConfigMode) => void;
  setShowThemeNameInput: (show: boolean) => void;
  setNewThemeName: (name: string) => void;
  setShowPresetMenu: (show: boolean) => void;
  setNewTheme: (theme: Record<string, unknown> | null) => void;

  setThemeColor: (colorVar: string, color: string) => void;
  setThemeUiScale: (uiScale: number) => void;
  setThemeSize: (sizeVar: string, size: number) => void;
  setThemeFont: (font: string) => void;
  setBackgroundColor: (color: string) => void;

  resetAppBasics: () => void;
  resetAppColors: () => void;
  resetTimespaceTimeline: () => void;
  resetTimespaceMarker: () => void;
  resetTimespaceColors: () => void;
  resetBackground: () => void;

  handleCopyHex: (key: string, value: string) => void;
  saveTheme: (saveThemeName: string) => void;
  handleDeleteCurrentLocalTheme: () => void;
  handleThemeSelect: (themeOption: ThemeOption) => void;
  openThemeDuplicateInput: () => void;

  setPreviewThemeName: (name: string) => void;
  clearPreviewThemeName: () => void;
  committedFont: string | null;
  setPreviewFont: (font: string) => void;
  clearPreviewFont: () => void;
}

export declare function useThemeConfigState(
  options: UseThemeConfigStateOptions,
): ThemeConfigState;
