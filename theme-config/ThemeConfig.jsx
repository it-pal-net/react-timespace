import { useMemo } from "react";
import PropTypes from "prop-types";
import { AppWindow, Clock, Image as ImageIcon } from "lucide-react";

import { colorLabels as defaultColorLabels } from "../theming/themes";
import { ThemeConfigContext } from "./configContext";
import ThemeConfigAppTab from "./ThemeConfigAppTab";
import ThemeConfigBackgroundTab from "./ThemeConfigBackgroundTab";
import ThemeConfigFooter from "./ThemeConfigFooter";
import ThemeConfigPresetToolbar from "./ThemeConfigPresetToolbar";
import ThemeConfigTimespacesTab from "./ThemeConfigTimespacesTab";
import useThemeConfigState from "./useThemeConfigState";

import * as S from "./styled";

function ThemeConfig({
  excludedThemeNames = [],
  showTimespaceRenderingControls = true,
  showGroupTimelinesControl = false,
  prefs,
  onPrefsChange,
  components = {},
  colorLabels = {},
}) {
  const configContextValue = useMemo(
    () => ({
      components,
      colorLabels: { ...defaultColorLabels, ...colorLabels },
    }),
    [components, colorLabels],
  );

  const state = useThemeConfigState({
    excludedThemeNames,
    showTimespaceRenderingControls,
  });
  const presetToolbarState = {
    theme: state.theme,
    themesOptions: state.themesOptions,
    selectedThemeOption: state.selectedThemeOption,
    hasGlobalChanges: state.hasGlobalChanges,
    showThemeNameInput: state.showThemeNameInput,
    newThemeName: state.newThemeName,
    showPresetMenu: state.showPresetMenu,
    menuRef: state.menuRef,
  };
  const presetToolbarActions = {
    onSetPreviewThemeName: state.setPreviewThemeName,
    onClearPreviewThemeName: state.clearPreviewThemeName,
    onThemeSelect: state.handleThemeSelect,
    onThemeNameChange: state.setNewThemeName,
    onToggleThemeNameInput: state.setShowThemeNameInput,
    onSaveTheme: state.saveTheme,
    onSaveCurrentOrDuplicate: () => {
      if (state.theme.type === "localTheme") {
        state.saveTheme(state.theme.name);
      } else {
        state.openThemeDuplicateInput();
      }
    },
    onOpenDuplicateInput: state.openThemeDuplicateInput,
    onTogglePresetMenu: (nextValue) => {
      if (typeof nextValue === "boolean") {
        state.setShowPresetMenu(nextValue);
        return;
      }
      state.setShowPresetMenu((prev) => !prev);
    },
    onDeleteCurrentLocalTheme: state.handleDeleteCurrentLocalTheme,
    onResetThemeDraft: () => {
      state.setNewTheme(null);
      state.setShowPresetMenu(false);
    },
    onStartRenameTheme: () => {
      state.setNewThemeName(state.theme.name);
      state.setShowThemeNameInput(true);
      state.setShowPresetMenu(false);
    },
  };
  const appTabState = {
    theme: state.theme,
    committedFont: state.committedFont,
    themeMode: state.themeMode,
    appThemeColorKeys: state.appThemeColorKeys,
    hasAppBasicsChanges: state.hasAppBasicsChanges,
    hasAppColorsChanges: state.hasAppColorsChanges,
  };
  const appTabActions = {
    onSetThemeMode: state.setThemeMode,
    onSetThemeFont: state.setThemeFont,
    onSetPreviewFont: state.setPreviewFont,
    onClearPreviewFont: state.clearPreviewFont,
    onSetThemeColor: state.setThemeColor,
    onResetAppBasics: state.resetAppBasics,
    onResetAppColors: state.resetAppColors,
  };
  const timespacesTabState = {
    theme: state.theme,
    timespaceThemeColorKeys: state.timespaceThemeColorKeys,
    hasTimelineChanges: state.hasTimelineChanges,
    hasMarkerChanges: state.hasMarkerChanges,
    hasTimespaceColorsChanges: state.hasTimespaceColorsChanges,
  };
  const timespacesTabActions = {
    onSetThemeUiScale: state.setThemeUiScale,
    onSetThemeSize: state.setThemeSize,
    onSetThemeColor: state.setThemeColor,
    onResetTimespaceTimeline: state.resetTimespaceTimeline,
    onResetTimespaceMarker: state.resetTimespaceMarker,
    onResetTimespaceColors: state.resetTimespaceColors,
  };
  const backgroundTabState = {
    theme: state.theme,
    hasBackgroundChanges: state.hasBackgroundChanges,
  };
  const backgroundTabActions = {
    onSetBackgroundColor: state.setBackgroundColor,
    onResetBackground: state.resetBackground,
  };

  return (
    <ThemeConfigContext.Provider value={configContextValue}>
      <S.ThemeConfig>
        <ThemeConfigPresetToolbar
          state={presetToolbarState}
          actions={presetToolbarActions}
        />

        <S.CompactTabs>
          <S.CompactTab
            type="button"
            isActive={state.activeTab === "app"}
            onClick={() => state.setActiveTab("app")}
          >
            <AppWindow size={14} />
            App
          </S.CompactTab>
          {state.showTimespaceRenderingControls && (
            <S.CompactTab
              type="button"
              isActive={state.activeTab === "timespaces"}
              onClick={() => state.setActiveTab("timespaces")}
            >
              <Clock size={14} />
              Time Zones
            </S.CompactTab>
          )}
          <S.CompactTab
            type="button"
            isActive={state.activeTab === "background"}
            onClick={() => state.setActiveTab("background")}
          >
            <ImageIcon size={14} />
            Background
          </S.CompactTab>
        </S.CompactTabs>

        {state.activeTab === "app" && (
          <ThemeConfigAppTab state={appTabState} actions={appTabActions} />
        )}

        {state.activeTab === "timespaces" &&
          state.showTimespaceRenderingControls && (
            <ThemeConfigTimespacesTab
              state={timespacesTabState}
              actions={timespacesTabActions}
              showGroupTimelinesControl={showGroupTimelinesControl}
              prefs={prefs}
              onPrefsChange={onPrefsChange}
            />
          )}

        {state.activeTab === "background" && (
          <ThemeConfigBackgroundTab
            state={backgroundTabState}
            actions={backgroundTabActions}
          />
        )}

        <ThemeConfigFooter
          state={presetToolbarState}
          actions={presetToolbarActions}
        />
      </S.ThemeConfig>
    </ThemeConfigContext.Provider>
  );
}

ThemeConfig.propTypes = {
  excludedThemeNames: PropTypes.arrayOf(PropTypes.string),
  showTimespaceRenderingControls: PropTypes.bool,
  // When true, the Time Zones tab also offers the host-consumed
  // "Group timelines by" control (writes the `groupTimelinesBy` pref).
  showGroupTimelinesControl: PropTypes.bool,
  // Controlled prefs: pass both to drive the Time Zones view prefs from host
  // state (e.g. URL) instead of localStorage.
  prefs: PropTypes.object,
  onPrefsChange: PropTypes.func,
  // Optional host-app component slots: { Select, Input, GradientPicker,
  // ImagePicker }. Background gradient/image fills are only offered when the
  // matching slot is provided.
  components: PropTypes.object,
  // Extra labels for host-specific theme color keys, merged over the
  // package's own labels.
  colorLabels: PropTypes.object,
};

export default ThemeConfig;
