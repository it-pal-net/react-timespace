import PropTypes from "prop-types";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { useThemeConfigContext } from "./configContext";
import PresetSelect from "./PresetSelect";

import * as S from "./styled";

function ThemeConfigPresetToolbar({ state, actions }) {
  const { components } = useThemeConfigContext();
  const Select = components.Select ?? PresetSelect;
  const isLocalTheme = state.theme.type === "localTheme";

  return (
    <S.PresetToolbar>
      <S.PresetHeader>
        <S.SectionHeaderTitle>Theme</S.SectionHeaderTitle>
      </S.PresetHeader>

      <S.PresetRow>
        <S.PresetSelectWrap>
          <Select
            placeholder="Select Theme"
            options={state.themesOptions}
            value={state.selectedThemeOption}
            formatOptionLabel={(themeOption, meta) =>
              meta.context === "value" && state.hasGlobalChanges ? (
                <S.SelectValueWithDot>
                  {themeOption.label}
                  <S.DirtyDot title="Unsaved changes" />
                </S.SelectValueWithDot>
              ) : (
                themeOption.label
              )
            }
            onOptionHover={(themeOption) => {
              if (themeOption?.value) {
                actions.onSetPreviewThemeName(themeOption.value);
              }
            }}
            onMenuMouseLeave={actions.onClearPreviewThemeName}
            onMenuClose={actions.onClearPreviewThemeName}
            onChange={actions.onThemeSelect}
          />
        </S.PresetSelectWrap>
        <S.MenuAnchor ref={state.menuRef}>
          <S.KebabButton
            type="button"
            aria-label="Theme actions"
            aria-haspopup="menu"
            aria-expanded={state.showPresetMenu}
            title="Theme actions"
            onClick={() => actions.onTogglePresetMenu()}
          >
            <MoreHorizontal size={18} />
          </S.KebabButton>
          {state.showPresetMenu && (
            <S.MenuPopover role="menu">
              <S.MenuItem
                type="button"
                role="menuitem"
                onClick={() => {
                  actions.onTogglePresetMenu(false);
                  actions.onOpenDuplicateInput();
                }}
              >
                <Copy size={13} />
                Duplicate…
              </S.MenuItem>
              {isLocalTheme && (
                <S.MenuItem
                  type="button"
                  role="menuitem"
                  onClick={actions.onStartRenameTheme}
                >
                  <Pencil size={13} />
                  Rename…
                </S.MenuItem>
              )}
              {isLocalTheme && (
                <>
                  <S.MenuSeparator />
                  <S.MenuItem
                    type="button"
                    role="menuitem"
                    variant="danger"
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Delete the "${state.theme.name}" theme? This can't be undone.`,
                      );
                      if (confirmed) {
                        actions.onDeleteCurrentLocalTheme();
                      }
                    }}
                  >
                    <Trash2 size={13} />
                    Delete theme
                  </S.MenuItem>
                </>
              )}
            </S.MenuPopover>
          )}
        </S.MenuAnchor>
      </S.PresetRow>
    </S.PresetToolbar>
  );
}

ThemeConfigPresetToolbar.propTypes = {
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};

export default ThemeConfigPresetToolbar;
