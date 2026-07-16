import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Check, ChevronUp, X } from "lucide-react";

import { useThemeConfigContext } from "./configContext";

import * as S from "./styled";

function ThemeConfigFooter({ state, actions }) {
  const { components } = useThemeConfigContext();
  const Input = components.Input ?? S.InlineTextInput;
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef(null);

  useEffect(() => {
    if (!isSaveMenuOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target)) {
        setIsSaveMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSaveMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isSaveMenuOpen]);

  if (!state.hasGlobalChanges && !state.showThemeNameInput) {
    return null;
  }

  if (state.showThemeNameInput) {
    return (
      <S.FooterBar>
        <S.InlineField style={{ flex: 1 }}>
          <Input
            value={state.newThemeName}
            autoFocus
            placeholder="Theme name"
            onChange={(ev) => {
              actions.onThemeNameChange(ev.target.value);
            }}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" && state.newThemeName.trim()) {
                actions.onSaveTheme();
              }
              if (ev.key === "Escape") {
                actions.onToggleThemeNameInput(false);
              }
            }}
          />
          <S.IconActionButton
            type="button"
            alwaysVisible
            aria-label="Save theme name"
            disabled={!state.newThemeName.trim()}
            onClick={() => actions.onSaveTheme()}
          >
            <Check size={15} />
          </S.IconActionButton>
          <S.IconActionButton
            type="button"
            alwaysVisible
            aria-label="Cancel"
            onClick={() => actions.onToggleThemeNameInput(false)}
          >
            <X size={15} />
          </S.IconActionButton>
        </S.InlineField>
      </S.FooterBar>
    );
  }

  return (
    <S.FooterBar>
      <S.FooterStatus>Unsaved changes</S.FooterStatus>
      <S.FooterActions>
        <S.SubtleActionButton type="button" onClick={actions.onResetThemeDraft}>
          Discard
        </S.SubtleActionButton>
        <S.SplitButton ref={saveMenuRef}>
          <S.SplitButtonMain
            type="button"
            onClick={actions.onSaveCurrentOrDuplicate}
          >
            Save
          </S.SplitButtonMain>
          <S.SplitButtonToggle
            type="button"
            aria-label="More save options"
            aria-haspopup="menu"
            aria-expanded={isSaveMenuOpen}
            onClick={() => setIsSaveMenuOpen((prev) => !prev)}
          >
            <ChevronUp size={14} />
          </S.SplitButtonToggle>
          {isSaveMenuOpen && (
            <S.MenuPopover role="menu" placement="top">
              <S.MenuItem
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsSaveMenuOpen(false);
                  actions.onOpenDuplicateInput();
                }}
              >
                Save as new…
              </S.MenuItem>
            </S.MenuPopover>
          )}
        </S.SplitButton>
      </S.FooterActions>
    </S.FooterBar>
  );
}

ThemeConfigFooter.propTypes = {
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};

export default ThemeConfigFooter;
