// Compile-only smoke test for the hand-authored declarations.
//
// Nothing here runs — `npm run typecheck` fails if an export goes missing or a
// signature drifts from what the README and the JS actually do. Imports go
// through the package name so the tsconfig `paths` mirror how a consumer
// resolves them.

import { useContext, useEffect, useRef } from "react";

import Default, {
  Timespace,
  TimespaceProvider,
  TimeZonesProvider,
  InternalTimeZonesProvider,
  TimeZonesContext,
  TimeZonesClockContext,
  InternalTimeZonesContext,
  InternalTimeZonesClockContext,
  useTimeZonesClock,
  setState,
  setTimelines,
  addTimeline,
  updateTimeline,
  deleteTimeline,
  setTimeIntervals,
  addTimeInterval,
  updateTimeInterval,
  deleteTimeInterval,
  tzOptions,
  tzPresets,
  fontPresets,
  defaultTimespaceTheme,
  themePresets,
  colorLabels,
  TimespaceThemeProvider,
  ThemePreviewContext,
  useThemePreview,
  resolveTheme,
  formatDurationShort,
  formatDeltaToLocal,
  getTimeZoneOffsetSecondsSafe,
  SECONDS_IN_DAY,
  MILLISECONDS_IN_DAY,
  calculateAvailabilityGrid,
  normalizeAvailability,
  isMinuteAvailable,
} from "react-timespace";
import type {
  Availability,
  AvailabilityCell,
  LineHighlight,
  TimeInterval,
  TimeLine,
  TimespaceProps,
  TimespaceTheme,
  ThemeMode,
  ThemePreset,
  TimeZoneOption,
  TimeZonesState,
} from "react-timespace";

import ThemeConfigDefault, {
  ThemeConfig,
  useThemeConfigState,
} from "react-timespace/theme-config";
import type { ThemeConfigProps } from "react-timespace/theme-config";

import { composeTheme, deepMerge, DEFAULT_FONT } from "react-timespace/theming";
import zones, { tzPresets as presetsFromSubpath } from "react-timespace/tzOptions";
import { SET_STATE } from "react-timespace/state/actionTypes";
import { combinedKeyValueReducer } from "react-timespace/state/keyValueReducer";

// --- resources -------------------------------------------------------------

const availability: Availability = [
  { start: "08:30", end: "12:00" },
  { start: "22:00", end: "02:00" },
];

const berlin: TimeLine = {
  id: "berlin",
  orderId: 1,
  name: "Berlin",
  timeZone: "Europe/Berlin",
  availability,
};

// Host apps attach their own fields to the resource bag.
const withExtras: TimeLine = { ...berlin, contacts: ["a", "b"] };

const interval: TimeInterval = {
  id: "1",
  name: "Standup",
  time: 0,
  mode: "float",
  actionPoint: "xPos1",
  xPos1: null,
  xPos2: null,
  xPos1ClockSide: "right",
};

// --- actions ---------------------------------------------------------------

setState({ homeZone: "Europe/Berlin" });
setState("ui", { isEditMode: true });
setState((state: TimeZonesState) => state);
setTimelines([berlin, withExtras]);
setTimelines([berlin], "session");
addTimeline(berlin);
updateTimeline({ id: "berlin", name: "Berlin HQ" });
deleteTimeline("berlin");
setTimeIntervals([interval]);
addTimeInterval(interval);
updateTimeInterval({ id: "1", xPos1: 120 });
deleteTimeInterval("1");

// --- math and availability -------------------------------------------------

const duration: string = formatDurationShort(5400);
const delta: string | null = formatDeltaToLocal(25200);
const offset: number | null = getTimeZoneOffsetSecondsSafe("Asia/Bangkok", new Date());
const day: number = SECONDS_IN_DAY + MILLISECONDS_IN_DAY;

const ranges = normalizeAvailability(availability);
const free: boolean = isMinuteAvailable(ranges, 9 * 60);
const grid: Record<string, AvailabilityCell[]> = calculateAvailabilityGrid(
  [berlin],
  "Europe/Berlin",
);
const firstOverlap: number | undefined = grid.berlin?.[0]?.overlap[0]?.start;

// --- theming ---------------------------------------------------------------

const mode: ThemeMode = "dark";
const preset: ThemePreset = themePresets.dracula;
const flat: TimespaceTheme | null = resolveTheme("dracula", { mode });
const hand: string = defaultTimespaceTheme.color.intervalHandBody;
const label: string | undefined = colorLabels.borderHour;
const composed: TimespaceTheme = composeTheme({ themeName: "nord", mode });
const merged = deepMerge({ a: 1 }, { b: 2 });
const font: string = DEFAULT_FONT;
const fontValue: string = fontPresets[0].value;

// --- zone data -------------------------------------------------------------

const zone: TimeZoneOption = tzOptions[0];
const zoneName: string = zone.timeZone;
const groupLabel: string = tzPresets[0].label;
const sameZones: TimeZoneOption[] = zones;
const sameGroups = presetsFromSubpath;

// --- reducer plumbing ------------------------------------------------------

const reducerType: "SET_STATE" = SET_STATE;
const reducer = combinedKeyValueReducer<TimeZonesState>((state) => state);

// --- components ------------------------------------------------------------

const props: TimespaceProps = {
  minimal: true,
  deltaBase: "local",
  theme: "dracula",
  themeMode: "light",
  showSeconds: false,
  showTimezoneAbbreviation: true,
  recomputeCollisionsKey: 0,
  formatDuration: (seconds) => `${seconds}s`,
  getLineHighlight: (line): LineHighlight => (line.id === "berlin" ? "focus" : null),
  renderLineItems: (line) => <span>{line.name}</span>,
  renderPlaceSelector: ({ timeLine, height, onSelect, onBlur }) => (
    <select
      style={{ height }}
      onBlur={onBlur}
      onChange={() => onSelect({ name: timeLine.timeZone, label: "x", timeZone: "UTC" })}
    />
  ),
  handleAddTimelinePlace: (line, option) => void `${line.id}${option.timeZone}`,
  handleDeleteTimeline: (line) => void line.id,
  onSetTimelinesOrder: () => {},
  onAddCalendarEvent: (timeInterval) => void timeInterval.id,
};

const configProps: ThemeConfigProps = {
  excludedThemeNames: ["terminal"],
  excludedColorKeys: ["contactCardSelected"],
  showTabs: false,
  showTimespaceRenderingControls: true,
  colorLabels: { myKey: "My key" },
  components: { Select: (p: { value?: string }) => <span>{p.value}</span> },
};

function Zones() {
  const { tzDispatch, timeLines, timeIntervals, tzState } = useContext(TimeZonesContext);
  const { timeZonesClock, homeDayPassedPercent, startOfThisDay } = useTimeZonesClock();
  const { previewThemeName, setPreviewFont } = useThemePreview();
  const state = useThemeConfigState({ excludedThemeNames: [] });
  const measureElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    tzDispatch(setTimelines([berlin]));
  }, [tzDispatch]);

  const abbrev: string | undefined =
    timeZonesClock[timeLines[0]?.timeZone ?? "UTC"]?.timeZoneAbbreviation;

  return (
    <>
      <Timespace {...props} measureElRef={measureElRef} portalContainer={null} />
      <Default {...props} />
      <ThemeConfig {...configProps} />
      <ThemeConfigDefault {...configProps} />
      <span>
        {abbrev}
        {homeDayPassedPercent}
        {startOfThisDay.toISOString()}
        {tzState.intervalStepSeconds}
        {timeIntervals.length}
        {previewThemeName}
        {state.themeMode}
      </span>
      <button onClick={() => setPreviewFont("Kode Mono")}>font</button>
    </>
  );
}

export default function App() {
  return (
    <TimespaceThemeProvider forceThemeMode="dark" defaultFont={font}>
      <TimespaceProvider intervalSeconds={1} timeFormat="24">
        <Zones />
      </TimespaceProvider>
      <TimeZonesProvider>
        <InternalTimeZonesProvider>
          <ThemePreviewContext.Consumer>{() => null}</ThemePreviewContext.Consumer>
          <TimeZonesClockContext.Consumer>{() => null}</TimeZonesClockContext.Consumer>
          <InternalTimeZonesContext.Consumer>{() => null}</InternalTimeZonesContext.Consumer>
          <InternalTimeZonesClockContext.Consumer>
            {() => null}
          </InternalTimeZonesClockContext.Consumer>
        </InternalTimeZonesProvider>
      </TimeZonesProvider>
      <span>
        {duration}
        {delta}
        {offset}
        {day}
        {free}
        {firstOverlap}
        {hand}
        {label}
        {preset.name}
        {flat?.mode}
        {composed.uiScale}
        {merged.a + merged.b}
        {fontValue}
        {zoneName}
        {groupLabel}
        {sameZones.length}
        {sameGroups.length}
        {reducerType}
        {reducer({} as TimeZonesState, { type: SET_STATE }).homeZone}
        {interval.id}
      </span>
    </TimespaceThemeProvider>
  );
}
