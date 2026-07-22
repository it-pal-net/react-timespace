import PropTypes from "prop-types";

import useLocalStorage from "../hooks/useLocalStorage";
import ThemeConfigSectionCard from "./ThemeConfigSectionCard";

import * as S from "./styled";

// Timeline view preferences consumed live by the timeline: timeZonesProvider
// reads `timeFormat`, Timespace reads `showSeconds` / `showTimezoneAbbreviation`,
// and the host reads `groupTimelinesBy`. Two modes:
//   - Uncontrolled (the app): read/write localStorage directly.
//   - Controlled (URL-driven hosts like the /timespace playground): a `prefs`
//     object supplies the values and `onPrefsChange(key, value)` receives edits,
//     so NOTHING touches localStorage.
// They apply instantly and are independent of the theme draft/save flow (no
// reset button). `groupTimelinesBy` is host-consumed rather than read by the
// widget, so its control is opt-in via `showGroupTimelinesControl`.
function ThemeConfigTimespaceDisplay({
  showGroupTimelinesControl = false,
  prefs,
  onPrefsChange,
}) {
  const controlled = Boolean(prefs && onPrefsChange);

  // Hooks must run unconditionally; when controlled, their values are ignored.
  const [lsTimeFormat, setLsTimeFormat] = useLocalStorage("timeFormat", "24");
  const [lsAbbreviation, setLsAbbreviation] = useLocalStorage(
    "showTimezoneAbbreviation",
    false,
  );
  const [lsSeconds, setLsSeconds] = useLocalStorage("showSeconds", false);
  const [lsGroup, setLsGroup] = useLocalStorage("groupTimelinesBy", "timezone");

  const timeFormat = controlled ? prefs.timeFormat : lsTimeFormat;
  const showTimezoneAbbreviation = controlled
    ? prefs.showTimezoneAbbreviation
    : lsAbbreviation;
  const showSeconds = controlled ? prefs.showSeconds : lsSeconds;
  const groupTimelinesBy = controlled ? prefs.groupTimelinesBy : lsGroup;

  const setTimeFormat = controlled
    ? (value) => onPrefsChange("timeFormat", value)
    : setLsTimeFormat;
  const setShowTimezoneAbbreviation = controlled
    ? (value) => onPrefsChange("showTimezoneAbbreviation", value)
    : setLsAbbreviation;
  const setShowSeconds = controlled
    ? (value) => onPrefsChange("showSeconds", value)
    : setLsSeconds;
  const setGroupTimelinesBy = controlled
    ? (value) => onPrefsChange("groupTimelinesBy", value)
    : setLsGroup;

  return (
    <>
      <ThemeConfigSectionCard title="Clock">
        <S.CompactControl>
          <S.CompactControlRow>
            <S.ControlLabel>Time format</S.ControlLabel>
          </S.CompactControlRow>
          <S.SegmentedGroup role="radiogroup" aria-label="Time format">
            <S.SegmentedOption
              type="button"
              role="radio"
              aria-checked={timeFormat === "24"}
              isActive={timeFormat === "24"}
              onClick={() => setTimeFormat("24")}
            >
              24-hour · 13:00
            </S.SegmentedOption>
            <S.SegmentedOption
              type="button"
              role="radio"
              aria-checked={timeFormat === "12"}
              isActive={timeFormat === "12"}
              onClick={() => setTimeFormat("12")}
            >
              12-hour · 1:00 PM
            </S.SegmentedOption>
          </S.SegmentedGroup>
          <S.SecondaryText>
            Used across Contacts and Time Zones.
          </S.SecondaryText>
        </S.CompactControl>

        <S.PrefRow>
          <S.PrefRowMain>
            <S.ControlLabel>Show timezone abbreviation</S.ControlLabel>
            <S.SecondaryText>
              Show short timezone labels in timeline headers.
            </S.SecondaryText>
          </S.PrefRowMain>
          <S.Switch
            type="button"
            role="switch"
            aria-label="Show timezone abbreviation"
            aria-checked={showTimezoneAbbreviation}
            checked={showTimezoneAbbreviation}
            onClick={() =>
              setShowTimezoneAbbreviation(!showTimezoneAbbreviation)
            }
          />
        </S.PrefRow>

        <S.PrefRow>
          <S.PrefRowMain>
            <S.ControlLabel>Show seconds</S.ControlLabel>
            <S.SecondaryText>
              Display seconds in timeline clocks.
            </S.SecondaryText>
          </S.PrefRowMain>
          <S.Switch
            type="button"
            role="switch"
            aria-label="Show seconds"
            aria-checked={showSeconds}
            checked={showSeconds}
            onClick={() => setShowSeconds(!showSeconds)}
          />
        </S.PrefRow>
      </ThemeConfigSectionCard>

      {showGroupTimelinesControl && (
        <ThemeConfigSectionCard title="Layout">
          <S.CompactControl>
            <S.CompactControlRow>
              <S.ControlLabel>Group timelines by</S.ControlLabel>
            </S.CompactControlRow>
            <S.SegmentedGroup role="radiogroup" aria-label="Group timelines by">
              <S.SegmentedOption
                type="button"
                role="radio"
                aria-checked={groupTimelinesBy === "timezone"}
                isActive={groupTimelinesBy === "timezone"}
                onClick={() => setGroupTimelinesBy("timezone")}
              >
                Timezone
              </S.SegmentedOption>
              <S.SegmentedOption
                type="button"
                role="radio"
                aria-checked={groupTimelinesBy === "place"}
                isActive={groupTimelinesBy === "place"}
                onClick={() => setGroupTimelinesBy("place")}
              >
                Place
              </S.SegmentedOption>
            </S.SegmentedGroup>
          </S.CompactControl>
        </ThemeConfigSectionCard>
      )}
    </>
  );
}

ThemeConfigTimespaceDisplay.propTypes = {
  showGroupTimelinesControl: PropTypes.bool,
  // Controlled mode: supply both to drive the prefs from host state (URL)
  // instead of localStorage.
  prefs: PropTypes.shape({
    timeFormat: PropTypes.oneOf(["12", "24"]),
    showTimezoneAbbreviation: PropTypes.bool,
    showSeconds: PropTypes.bool,
    groupTimelinesBy: PropTypes.oneOf(["timezone", "place"]),
  }),
  onPrefsChange: PropTypes.func,
};

export default ThemeConfigTimespaceDisplay;
