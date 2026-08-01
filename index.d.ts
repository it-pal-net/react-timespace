// Public types for react-timespace.
//
// Hand-authored to match index.js. The runtime is JavaScript with prop-types,
// so this file is the contract — keep the two in sync when the API moves, and
// run `npm run typecheck` (types/__tests__/smoke.ts exercises every export).

import type {
  ComponentType,
  Context,
  Dispatch,
  MutableRefObject,
  ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/** IANA time zone id, e.g. `"Europe/Berlin"`. */
export type TimeZoneId = string;

/** `HH:mm` in 24-hour notation, local to the timeline's own zone. */
export type TimeOfDay = string;

export interface AvailabilityWindow {
  start: TimeOfDay;
  end: TimeOfDay;
}

/**
 * One window, or several. A window whose `end` is before its `start` wraps
 * midnight (`{ start: "22:00", end: "02:00" }`).
 */
export type Availability = AvailabilityWindow | AvailabilityWindow[];

/** `"edit"` renders the row's place selector instead of its name. */
export type TimeLineMode = "edit" | null;

/**
 * A timeline row. Host apps may carry extra fields (the reducer stores
 * resources verbatim), so unknown keys are allowed.
 */
export interface TimeLine {
  id: string;
  /** Sort key — rows render in ascending `orderId`. */
  orderId?: number;
  name?: string | null;
  timeZone: TimeZoneId;
  availability?: Availability | null;
  mode?: TimeLineMode;
  color?: string | null;
  /** Show the row's delete button (needs `handleDeleteTimeline` to do anything). */
  allowDelete?: boolean;
  /** Opt the row out of reordering. */
  isLocked?: boolean;
  [key: string]: unknown;
}

/**
 * Drag state of an interval. `"float"` is a freshly added interval that
 * follows the pointer without capture; `"fixed"` is at rest.
 */
export type TimeIntervalMode = "float" | "resize" | "move" | "fixed" | null;

/** Which endpoint of an interval a drag is acting on. */
export type IntervalPosKey = "xPos1" | "xPos2";

export type ClockSide = "left" | "right";

/**
 * A draggable time interval. `xPos*` are pixel offsets within the hours line
 * and are recomputed from `xPos*DayOffsetSeconds` whenever the width changes,
 * so persist the seconds and let the component derive the pixels.
 */
export interface TimeInterval {
  id: string;
  name?: string | null;
  /** Epoch milliseconds at creation. */
  time?: number;
  mode?: TimeIntervalMode;
  actionPoint?: IntervalPosKey | null;
  xPos1: number | null;
  xPos2: number | null;
  xPos1DayOffsetSeconds?: number | null;
  xPos2DayOffsetSeconds?: number | null;
  xPos1ClockSide?: ClockSide;
  xPos2ClockSide?: ClockSide;
  xPos1ClockCollide?: unknown;
  xPos2ClockCollide?: unknown;
  color?: string | null;
  durationPixels?: number | null;
  durationSeconds?: number | null;
  durationHuman?: string | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark";

/** The keys the Timespace components themselves read off the Emotion theme. */
export interface TimespaceTheme {
  mode: ThemeMode;
  uiScale: number;
  color: {
    intervalHandBody: string;
    text?: string;
    borderHour?: string;
    clockHandBody?: string;
    clockHandTail?: string;
    [key: string]: string | undefined;
  };
  size: {
    borderHour: number;
    clockHand: number;
    [key: string]: number | undefined;
  };
  name?: string;
  font?: string;
  background?: ThemeBackground;
  [key: string]: unknown;
}

export interface ThemeBackground {
  type: "color" | "gradient" | "image";
  color?: string;
  [key: string]: unknown;
}

/** One mode's worth of a preset. */
export interface ThemePresetMode {
  color: Record<string, string>;
  background?: ThemeBackground;
}

/**
 * A preset carries both modes plus mode-independent settings. `resolveTheme`
 * flattens it into a {@link TimespaceTheme} for one mode.
 */
export interface ThemePreset {
  name: string;
  label?: string;
  type?: "system" | "local" | string;
  light?: ThemePresetMode;
  dark?: ThemePresetMode;
  font?: string;
  uiScale?: number;
  size?: Record<string, number>;
}

export declare const defaultTimespaceTheme: TimespaceTheme;

/** The bundled presets, keyed by name (`"default"`, `"dracula"`, …). */
export declare const themePresets: Record<string, ThemePreset>;

/** Display labels for the color keys the widget reads. */
export declare const colorLabels: Record<string, string>;

/**
 * Flattens a preset name, a preset object or an already-flat theme into the
 * theme object the components read. Returns `null` for an unknown name so the
 * caller can fall back.
 */
export declare function resolveTheme(
  input: string | ThemePreset | Partial<TimespaceTheme> | null | undefined,
  options?: { mode?: ThemeMode; themes?: Record<string, ThemePreset> },
): TimespaceTheme | null;

export interface TimespaceThemeProviderProps {
  children?: ReactNode;
  /** Extend or override the preset registry. Defaults to {@link themePresets}. */
  themes?: Record<string, ThemePreset>;
  /** Pin the mode, ignoring the user's stored choice. */
  forceThemeMode?: ThemeMode;
  /** Used until the user stores a choice of their own. */
  defaultThemeName?: string;
  defaultThemeMode?: ThemeMode;
  defaultFont?: string;
}

/**
 * Mounts an Emotion `ThemeProvider` composed from the selected preset, the
 * user's saved themes and the unsaved draft (persisted in localStorage under
 * `themeName`, `themeMode`, `localThemes` and `newTheme`).
 */
export declare const TimespaceThemeProvider: ComponentType<TimespaceThemeProviderProps>;

export interface ThemePreviewContextValue {
  themes: Record<string, ThemePreset> | null;
  defaultThemeName: string;
  defaultThemeMode: ThemeMode;
  previewThemeName: string | null;
  setPreviewThemeName: (name: string) => void;
  clearPreviewThemeName: () => void;
  committedFont: string | null;
  previewFont: string | null;
  setPreviewFont: (font: string) => void;
  clearPreviewFont: () => void;
}

export declare const ThemePreviewContext: Context<ThemePreviewContextValue | null>;

/** Returns safe no-ops when used outside a {@link TimespaceThemeProvider}. */
export declare function useThemePreview(): ThemePreviewContextValue;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface TimeZonesState {
  isEditMode: boolean;
  homeZone: TimeZoneId;
  localZone: TimeZoneId;
  localeZoneOffsetMinutes: number;
  /** Default drag snapping step. `Ctrl/Cmd` overrides to 1s, `Shift` to 5min. */
  intervalStepSeconds: number;
  /**
   * How far the viewed 24h window is scrolled from the start of today in the
   * home zone, in hours: `0` today, `24` tomorrow, `-3` yesterday 21:00, …
   * Horizontal drag-scrolling over the hour strips commits the dragged hours
   * here; set it via `setState({ viewOffsetHours })` to scroll
   * programmatically.
   */
  viewOffsetHours: number;
  timeLinesIds: string[];
  timeLinesMap: Record<string, TimeLine>;
  timeIntervalsIds: string[];
  timeIntervalsMap: Record<string, TimeInterval>;
  [key: string]: unknown;
}

export interface TimeZonesAction {
  type: string;
  resourceName?: "timeLines" | "timeIntervals";
  payload?: unknown;
  keepTemporary?: boolean | string;
}

export type TimeZonesDispatch = Dispatch<TimeZonesAction>;

export interface TimeZonesContextValue {
  tzState: TimeZonesState;
  tzDispatch: TimeZonesDispatch;
  timeZones: TimeZoneId[];
  /** `timeLines` sorted by `orderId`. */
  timeLines: TimeLine[];
  timeIntervals: TimeInterval[];
}

export interface TimeZoneClock {
  hoursMinutesSeconds: string;
  hoursMinutes: string;
  timeZoneAbbreviation: string;
  timeZoneOffsetSeconds: number;
  timeZoneOffset: string;
}

export interface TimeZonesClockContextValue {
  /** Tick counter in whole seconds — useful for downstream throttling. */
  timer: number;
  startOfThisDay: Date;
  endOfThisDay: Date;
  timeZonesClock: Record<TimeZoneId, TimeZoneClock>;
  homeDayPassedPercent: number;
}

export interface TimeZonesProviderProps {
  children: ReactNode;
  /** Clock tick period. Defaults to 1. */
  intervalSeconds?: number;
  /** Controlled 12/24-hour clock. Falls back to the `timeFormat` localStorage key. */
  timeFormat?: "12" | "24";
}

export declare const TimeZonesProvider: ComponentType<TimeZonesProviderProps>;
/** Alias of {@link TimeZonesProvider}. */
export declare const TimespaceProvider: ComponentType<TimeZonesProviderProps>;
/**
 * A second provider on its own contexts, for mounting an isolated Timespace
 * inside a subtree that already has an app-level {@link TimeZonesProvider}.
 */
export declare const InternalTimeZonesProvider: ComponentType<TimeZonesProviderProps>;

export declare const TimeZonesContext: Context<TimeZonesContextValue>;
export declare const TimeZonesClockContext: Context<TimeZonesClockContextValue>;
export declare const InternalTimeZonesContext: Context<TimeZonesContextValue>;
export declare const InternalTimeZonesClockContext: Context<TimeZonesClockContextValue>;

/** Reads the clock context from whichever provider is nearest, internal first. */
export declare function useTimeZonesClock(): TimeZonesClockContextValue;

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Replace the whole state, one key, or map it with a function. */
export declare function setState(
  keyOrRootValues:
    | string
    | Record<string, unknown>
    | ((state: TimeZonesState) => TimeZonesState),
  maybeValues?: Record<string, unknown>,
): TimeZonesAction;

/**
 * Replace every row. `keepTemporary` retains ids prefixed
 * `temp-<keepTemporary>-` across the swap.
 */
export declare function setTimelines(
  payload: TimeLine[],
  keepTemporary?: boolean | string,
): TimeZonesAction;
export declare function addTimeline(payload: TimeLine): TimeZonesAction;
/** Shallow-merges `payload` into the row with the same `id`. */
export declare function updateTimeline(
  payload: Partial<TimeLine> & { id: string },
): TimeZonesAction;
/** Takes the row id, not the row. */
export declare function deleteTimeline(payload: string): TimeZonesAction;

export declare function setTimeIntervals(
  payload: TimeInterval[],
): TimeZonesAction;
export declare function addTimeInterval(payload: TimeInterval): TimeZonesAction;
/** Shallow-merges `payload` into the interval with the same `id`. */
export declare function updateTimeInterval(
  payload: Partial<TimeInterval> & { id: string },
): TimeZonesAction;
/** Takes the interval id, not the interval. */
export declare function deleteTimeInterval(payload: string): TimeZonesAction;

// ---------------------------------------------------------------------------
// Timespace component
// ---------------------------------------------------------------------------

/** An entry in the bundled zone list. */
export interface TimeZoneOption {
  name: string;
  label: string;
  timeZone: TimeZoneId;
  value?: string;
  /** Host apps returning a richer place from `renderPlaceSelector`. */
  place?: { timeZone: TimeZoneId; [key: string]: unknown };
  [key: string]: unknown;
}

export interface PlaceSelectorArgs {
  timeLine: TimeLine;
  /** CSS length, e.g. `"32px"` — match it to keep the row height stable. */
  height: string;
  onSelect: (option: TimeZoneOption) => void;
  onBlur: () => void;
}

export type LineHighlight = "focus" | "dim" | null;

export interface TimespaceProps {
  /** Render your own content on a row (contacts, avatars…). */
  renderLineItems?: (timeLine: TimeLine) => ReactNode;
  /** Emphasize or de-emphasize a row. */
  getLineHighlight?: (timeLine: TimeLine) => LineHighlight;
  /** Replace the built-in zone `<select>` with your own place search. */
  renderPlaceSelector?: (args: PlaceSelectorArgs) => ReactNode;
  /**
   * Persist a picked place. Omit to let the built-in select write the row's
   * name and zone straight into state.
   */
  handleAddTimelinePlace?: (timeLine: TimeLine, option: TimeZoneOption) => void;
  /** Show the row's delete button and handle the click. */
  handleDeleteTimeline?: (timeLine: TimeLine) => void;
  /**
   * Fires after a reorder drag settles, with no arguments — read the new
   * order from `timeLines` on the context.
   */
  onSetTimelinesOrder?: () => void;
  /** Show the calendar button on intervals and handle scheduling. */
  onAddCalendarEvent?: (timeInterval: TimeInterval) => void;
  /** Override the `"1h 30m"` duration formatting (i18n). */
  formatDuration?: (seconds: number) => string;
  showTimezoneAbbreviation?: boolean;
  showSeconds?: boolean;
  /** Distraction-free rows: name, clock and hour strip only. */
  minimal?: boolean;
  /** Base zone for the per-row `+7h` delta labels. Defaults to `"home"`. */
  deltaBase?: "local" | "home";
  /** Preset name, preset object, or a flat theme. */
  theme?: string | ThemePreset | Partial<TimespaceTheme>;
  themeMode?: ThemeMode;
  /** Host element for the row-drag ghost overlay. */
  portalContainer?: Element | null;
  /** Measure against this element instead of the internal list container. */
  measureElRef?: MutableRefObject<Element | null>;
  /** Bump to force a collision/layout recompute after external changes. */
  recomputeCollisionsKey?: number;
}

export declare const Timespace: ComponentType<TimespaceProps>;
export default Timespace;

// ---------------------------------------------------------------------------
// Zone and font data
// ---------------------------------------------------------------------------

/** Every bundled IANA zone, as `<select>`-ready options. */
export declare const tzOptions: TimeZoneOption[];

/** Grouped zone options for a picker with sections. */
export declare const tzPresets: Array<{
  label: string;
  zones: TimeZoneOption[];
}>;

export declare const fontPresets: Array<{
  name: string;
  label: string;
  value: string;
}>;

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

export declare const SECONDS_IN_DAY: 86400;
export declare const MILLISECONDS_IN_DAY: 86400000;
export declare const MILLISECONDS_IN_HOUR: 3600000;

/** `5400` → `"1h 30m"`. Empty string for `0` or a falsy input. */
export declare function formatDurationShort(seconds: number): string;

/** `25200` → `"+7h"`. `null` when the delta is unknown. */
export declare function formatDeltaToLocal(
  deltaSeconds: number | null | undefined,
): string | null;

/** UTC offset of `timeZone` at `date` (now if omitted). `null` if unresolvable. */
export declare function getTimeZoneOffsetSecondsSafe(
  timeZone: TimeZoneId | null | undefined,
  date?: Date,
): number | null;

/** UTC ms of 00:00 of `date`'s calendar day in `timeZone`. */
export declare function getStartOfZonedDayUtcMs(
  timeZone: TimeZoneId,
  date?: Date,
): number;

/** `27` → `"+1d 3h"`, `-5` → `"-5h"`, `0` → `"0h"`. */
export declare function formatHourOffsetLabel(offsetHours: number): string;

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/** Start and end within an hour cell, as fractions in `0..1`. */
export interface AvailabilitySegment {
  start: number;
  end: number;
}

export interface AvailabilityCell {
  /** Where this row is available. */
  available: AvailabilitySegment[];
  /** Where every row that declared availability overlaps. */
  overlap: AvailabilitySegment[];
}

/** Minutes from midnight, in the timeline's own zone. */
export interface AvailabilityRange {
  start: number;
  end: number;
}

/** Parses `HH:mm` windows into minute offsets, dropping malformed entries. */
export declare function normalizeAvailability(
  availability: Availability | null | undefined,
): AvailabilityRange[];

export declare function isMinuteAvailable(
  ranges: AvailabilityRange[],
  minuteOfDay: number,
): boolean;

/**
 * Projects each row's local windows onto the home-zone day. Keyed by timeline
 * id, 24 cells per row. Rows without `availability` are absent from the result
 * and sit out of the overlap calculation.
 */
export declare function calculateAvailabilityGrid(
  timeLines: TimeLine[],
  homeZone: TimeZoneId,
  date?: Date,
): Record<string, AvailabilityCell[]>;
