import PropTypes from "prop-types";
import { Moon, Sun } from "lucide-react";

import FontCombobox from "./FontCombobox";
import ThemeConfigColorRows from "./ThemeConfigColorRows";
import ThemeConfigSectionCard from "./ThemeConfigSectionCard";

import * as S from "./styled";

function ThemeConfigAppTab({ state, actions }) {
  return (
    <>
      <ThemeConfigSectionCard
        title="Basics"
        onReset={actions.onResetAppBasics}
        canReset={state.hasAppBasicsChanges}
      >
        <S.CompactControl>
          <S.CompactControlRow>
            <S.ControlLabel>Color scheme</S.ControlLabel>
          </S.CompactControlRow>
          <S.SegmentedGroup role="radiogroup" aria-label="Color scheme">
            <S.SegmentedOption
              type="button"
              role="radio"
              aria-checked={state.themeMode === "dark"}
              isActive={state.themeMode === "dark"}
              onClick={() => actions.onSetThemeMode("dark")}
            >
              <Moon size={13} />
              Dark
            </S.SegmentedOption>
            <S.SegmentedOption
              type="button"
              role="radio"
              aria-checked={state.themeMode === "light"}
              isActive={state.themeMode === "light"}
              onClick={() => actions.onSetThemeMode("light")}
            >
              <Sun size={13} />
              Light
            </S.SegmentedOption>
          </S.SegmentedGroup>
        </S.CompactControl>

        <S.CompactControl>
          <S.CompactControlRow>
            <S.ControlLabel>Font</S.ControlLabel>
          </S.CompactControlRow>
          <S.FontControlGroup>
            <FontCombobox
              font={state.committedFont}
              onSetThemeFont={actions.onSetThemeFont}
              onPreviewFont={actions.onSetPreviewFont}
              onClearPreviewFont={actions.onClearPreviewFont}
            />
            <S.SecondaryText>
              Weight 400 · any{" "}
              <S.LinkHint
                href="https://fonts.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                Google Font
              </S.LinkHint>{" "}
              family or variable font
            </S.SecondaryText>
          </S.FontControlGroup>
        </S.CompactControl>
      </ThemeConfigSectionCard>

      {state.appThemeColorKeys.length > 0 && (
        <ThemeConfigSectionCard
          title="Colors"
          onReset={actions.onResetAppColors}
          canReset={state.hasAppColorsChanges}
        >
          <ThemeConfigColorRows
            colorKeys={state.appThemeColorKeys}
            theme={state.theme}
            onSetThemeColor={actions.onSetThemeColor}
          />
        </ThemeConfigSectionCard>
      )}
    </>
  );
}

ThemeConfigAppTab.propTypes = {
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};

export default ThemeConfigAppTab;
