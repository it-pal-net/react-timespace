import PropTypes from "prop-types";

import SliderValueInput from "./SliderValueInput";
import ThemeConfigColorRows from "./ThemeConfigColorRows";
import ThemeConfigSectionCard from "./ThemeConfigSectionCard";
import ThemeConfigTimespaceDisplay from "./ThemeConfigTimespaceDisplay";

import * as S from "./styled";

const getSliderFillPercent = (value, min, max) =>
  Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

function ThemeConfigTimespacesTab({
  state,
  actions,
  showGroupTimelinesControl = false,
  prefs,
  onPrefsChange,
}) {
  return (
    <>
      <ThemeConfigTimespaceDisplay
        showGroupTimelinesControl={showGroupTimelinesControl}
        prefs={prefs}
        onPrefsChange={onPrefsChange}
      />

      <ThemeConfigSectionCard
        title="Timeline"
        onReset={actions.onResetTimespaceTimeline}
        canReset={state.hasTimelineChanges}
      >
        <S.CompactControl>
          <S.CompactControlRow>
            <S.ControlLabel>UI Scale</S.ControlLabel>
            <SliderValueInput
              value={Math.round(state.theme.uiScale * 100)}
              unit="%"
              min={50}
              max={250}
              ariaLabel="UI scale percent"
              onCommit={(percent) => actions.onSetThemeUiScale(percent / 100)}
            />
          </S.CompactControlRow>
          <S.CompactSlider
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={state.theme.uiScale}
            fillPercent={getSliderFillPercent(state.theme.uiScale, 0.5, 2.5)}
            onChange={(ev) =>
              actions.onSetThemeUiScale(Number(ev.target.value))
            }
          />
        </S.CompactControl>
        <S.CompactControl>
          <S.CompactControlRow>
            <S.ControlLabel>Hour Grid</S.ControlLabel>
            <SliderValueInput
              value={state.theme.size.borderHour}
              unit="px"
              min={0.1}
              max={10}
              ariaLabel="Hour grid width in pixels"
              onCommit={(px) => actions.onSetThemeSize("borderHour", px)}
            />
          </S.CompactControlRow>
          <S.CompactSlider
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={state.theme.size.borderHour}
            fillPercent={getSliderFillPercent(
              state.theme.size.borderHour,
              0.1,
              10,
            )}
            onChange={(ev) =>
              actions.onSetThemeSize("borderHour", Number(ev.target.value))
            }
          />
        </S.CompactControl>
      </ThemeConfigSectionCard>

      <ThemeConfigSectionCard
        title="Marker"
        onReset={actions.onResetTimespaceMarker}
        canReset={state.hasMarkerChanges}
      >
        <S.CompactControl>
          <S.CompactControlRow>
            <S.ControlLabel>Time Marker</S.ControlLabel>
            <SliderValueInput
              value={state.theme.size.clockHand}
              unit="px"
              min={1}
              max={4}
              ariaLabel="Time marker width in pixels"
              onCommit={(px) => actions.onSetThemeSize("clockHand", px)}
            />
          </S.CompactControlRow>
          <S.CompactSlider
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={state.theme.size.clockHand}
            fillPercent={getSliderFillPercent(state.theme.size.clockHand, 1, 4)}
            onChange={(ev) =>
              actions.onSetThemeSize("clockHand", Number(ev.target.value))
            }
          />
        </S.CompactControl>
      </ThemeConfigSectionCard>

      {state.timespaceThemeColorKeys.length > 0 && (
        <ThemeConfigSectionCard
          title="Colors"
          onReset={actions.onResetTimespaceColors}
          canReset={state.hasTimespaceColorsChanges}
        >
          <ThemeConfigColorRows
            colorKeys={state.timespaceThemeColorKeys}
            theme={state.theme}
            onSetThemeColor={actions.onSetThemeColor}
          />
        </ThemeConfigSectionCard>
      )}
    </>
  );
}

ThemeConfigTimespacesTab.propTypes = {
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  showGroupTimelinesControl: PropTypes.bool,
  prefs: PropTypes.object,
  onPrefsChange: PropTypes.func,
};

export default ThemeConfigTimespacesTab;
