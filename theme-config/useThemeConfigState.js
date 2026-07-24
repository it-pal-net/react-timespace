import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTheme } from "@emotion/react";

import deepMerge from "../theming/deepMerge";
import useLocalStorage from "../hooks/useLocalStorage";
import themePresets from "../theming/themes";
import { useThemePreview } from "../theming/ThemePreviewContext";

const TIMESPACES_COLOR_KEYS = [
  "borderHour",
  "clockHandBody",
  "clockHandTail",
  "intervalHandBody",
];

export default function useThemeConfigState({
  excludedThemeNames = [],
  showTimespaceRenderingControls = true,
  excludedColorKeys = [],
}) {
  const theme = useTheme();
  const {
    themes,
    defaultThemeName,
    defaultThemeMode,
    setPreviewThemeName,
    clearPreviewThemeName,
    committedFont,
    setPreviewFont,
    clearPreviewFont,
  } = useThemePreview();
  const allThemes = themes ?? themePresets;
  const [_, setNewTheme] = useLocalStorage("newTheme", null);
  const [localThemes, setLocalThemes] = useLocalStorage("localThemes", {});
  // Until the user stores a choice the provider decides, and it may follow the
  // host app, so show what it fell back to rather than assuming the presets.
  const [storedThemeName, setTheme] = useLocalStorage("themeName", null);
  const themeName = storedThemeName ?? defaultThemeName;
  const [storedThemeMode, setThemeMode] = useLocalStorage("themeMode", null);
  const themeMode = storedThemeMode ?? defaultThemeMode;
  const [newThemeName, setNewThemeName] = useState("");
  const [showThemeNameInput, setShowThemeNameInput] = useState(false);
  const [activeTab, setActiveTab] = useState("app");
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [copiedHexKey, setCopiedHexKey] = useState(null);
  const menuRef = useRef(null);

  // Host apps can hide color keys that are meaningless in their surface (e.g.
  // the synccontact-only `contactCardSelected` on the generic /timespace
  // playground). Filtering here keeps them out of the rows, the change
  // detection and the reset handlers alike.
  const themeColorVariables = useMemo(
    () =>
      Object.keys(theme.color).filter(
        (colorVar) => !excludedColorKeys.includes(colorVar),
      ),
    [theme.color, excludedColorKeys],
  );
  const appThemeColorKeys = useMemo(
    () =>
      themeColorVariables.filter(
        (colorVar) => !TIMESPACES_COLOR_KEYS.includes(colorVar),
      ),
    [themeColorVariables],
  );
  const timespaceThemeColorKeys = useMemo(
    () =>
      themeColorVariables.filter((colorVar) =>
        TIMESPACES_COLOR_KEYS.includes(colorVar),
      ),
    [themeColorVariables],
  );

  const themesOptions = useMemo(() => {
    const filteredThemeNames = Object.keys(allThemes).filter(
      (name) => !excludedThemeNames.includes(name),
    );
    return [
      {
        label: "System",
        options: filteredThemeNames.map((name) => ({
          value: name,
          label: allThemes[name].label ?? name,
        })),
      },
      {
        label: "Local",
        options: Object.keys(localThemes).map((name) => ({
          value: name,
          label: localThemes[name].label ?? name,
        })),
      },
    ];
  }, [allThemes, excludedThemeNames, localThemes]);

  const selectedThemeOption = useMemo(
    () =>
      themesOptions[0].options.find((option) => option.value === themeName) ??
      themesOptions[1].options.find((option) => option.value === themeName) ?? {
        value: themeName,
        label: themeName,
      },
    [themeName, themesOptions],
  );

  const commitThemeDraft = useCallback(
    (draftTheme) => {
      if (!draftTheme || Object.keys(draftTheme).length === 0) {
        setNewTheme(null);
        return;
      }
      setNewTheme(JSON.stringify(draftTheme));
    },
    [setNewTheme],
  );

  const pruneModeDraft = useCallback((draftTheme, modeKey) => {
    if (!draftTheme?.[modeKey]) {
      return;
    }
    if (
      draftTheme[modeKey].color &&
      Object.keys(draftTheme[modeKey].color).length === 0
    ) {
      delete draftTheme[modeKey].color;
    }
    if (
      draftTheme[modeKey].background &&
      Object.keys(draftTheme[modeKey].background).length === 0
    ) {
      delete draftTheme[modeKey].background;
    }
    if (Object.keys(draftTheme[modeKey]).length === 0) {
      delete draftTheme[modeKey];
    }
  }, []);

  const saveTheme = useCallback(
    (saveThemeName) => {
      setLocalThemes({
        ...(theme.type === "localTheme" && theme.name !== newThemeName
          ? Object.fromEntries(
              Object.entries(localThemes).filter(([key]) => key !== theme.name),
            )
          : localThemes),
        [saveThemeName ?? newThemeName]: deepMerge(theme.original, {
          ...theme.newTheme,
          name: saveThemeName ?? newThemeName,
          label: saveThemeName ?? newThemeName,
          type: "localTheme",
        }),
      });

      setNewTheme(null);
      setTheme(saveThemeName ?? newThemeName);
      setNewThemeName("");
      setShowThemeNameInput(false);
    },
    [localThemes, newThemeName, setLocalThemes, setNewTheme, setTheme, theme],
  );

  const setThemeColor = useCallback(
    (colorVar, color) => {
      const newTheme = theme.newTheme ?? {};
      setNewTheme(
        JSON.stringify({
          ...newTheme,
          [theme.mode]: {
            ...(newTheme[theme.mode] ?? {}),
            color: {
              ...(newTheme[theme.mode]?.color ?? {}),
              [colorVar]: color,
            },
          },
        }),
      );
    },
    [setNewTheme, theme.mode, theme.newTheme],
  );

  const setThemeUiScale = useCallback(
    (uiScale) => {
      const newTheme = theme.newTheme ?? {};
      setNewTheme(
        JSON.stringify({
          ...newTheme,
          uiScale,
        }),
      );
    },
    [setNewTheme, theme.newTheme],
  );

  const setThemeSize = useCallback(
    (sizeVar, size) => {
      const newTheme = theme.newTheme ?? {};
      setNewTheme(
        JSON.stringify({
          ...newTheme,
          size: {
            ...(newTheme.size ?? {}),
            [sizeVar]: size,
          },
        }),
      );
    },
    [setNewTheme, theme.newTheme],
  );

  const setThemeFont = useCallback(
    (font) => {
      const newTheme = theme.newTheme ?? {};
      setNewTheme(
        JSON.stringify({
          ...newTheme,
          font,
        }),
      );
    },
    [setNewTheme, theme.newTheme],
  );

  const setBackgroundColor = useCallback(
    (color) => {
      const newTheme = theme.newTheme ?? {};
      setNewTheme(
        JSON.stringify({
          ...newTheme,
          [theme.mode]: {
            ...(newTheme[theme.mode] ?? {}),
            background: {
              ...(newTheme[theme.mode]?.background ?? {}),
              type: "color",
              color,
            },
          },
        }),
      );
    },
    [setNewTheme, theme.mode, theme.newTheme],
  );

  const resetAppBasics = useCallback(() => {
    const newTheme = theme.newTheme ?? {};
    const nextTheme = { ...newTheme };
    delete nextTheme.font;
    commitThemeDraft(nextTheme);

    setThemeMode(theme.original.mode ?? "dark");
  }, [commitThemeDraft, setThemeMode, theme.newTheme, theme.original]);

  const resetAppColors = useCallback(() => {
    const nextTheme = { ...(theme.newTheme ?? {}) };
    const modeDraft = { ...(nextTheme[theme.mode] ?? {}) };
    const colorDraft = { ...(modeDraft.color ?? {}) };

    appThemeColorKeys.forEach((colorVar) => {
      delete colorDraft[colorVar];
    });

    modeDraft.color = colorDraft;
    nextTheme[theme.mode] = modeDraft;
    pruneModeDraft(nextTheme, theme.mode);
    commitThemeDraft(nextTheme);
  }, [
    appThemeColorKeys,
    commitThemeDraft,
    pruneModeDraft,
    theme.mode,
    theme.newTheme,
  ]);

  const resetTimespaceTimeline = useCallback(() => {
    const nextTheme = { ...(theme.newTheme ?? {}) };
    delete nextTheme.uiScale;

    if (nextTheme.size) {
      const nextSize = { ...nextTheme.size };
      delete nextSize.borderHour;
      if (Object.keys(nextSize).length === 0) {
        delete nextTheme.size;
      } else {
        nextTheme.size = nextSize;
      }
    }

    commitThemeDraft(nextTheme);
  }, [commitThemeDraft, theme.newTheme]);

  const resetTimespaceMarker = useCallback(() => {
    const nextTheme = { ...(theme.newTheme ?? {}) };
    if (nextTheme.size) {
      const nextSize = { ...nextTheme.size };
      delete nextSize.clockHand;
      if (Object.keys(nextSize).length === 0) {
        delete nextTheme.size;
      } else {
        nextTheme.size = nextSize;
      }
    }
    commitThemeDraft(nextTheme);
  }, [commitThemeDraft, theme.newTheme]);

  const resetTimespaceColors = useCallback(() => {
    const nextTheme = { ...(theme.newTheme ?? {}) };
    const modeDraft = { ...(nextTheme[theme.mode] ?? {}) };
    const colorDraft = { ...(modeDraft.color ?? {}) };

    timespaceThemeColorKeys.forEach((colorVar) => {
      delete colorDraft[colorVar];
    });

    modeDraft.color = colorDraft;
    nextTheme[theme.mode] = modeDraft;
    pruneModeDraft(nextTheme, theme.mode);
    commitThemeDraft(nextTheme);
  }, [
    commitThemeDraft,
    pruneModeDraft,
    theme.mode,
    theme.newTheme,
    timespaceThemeColorKeys,
  ]);

  const resetBackground = useCallback(() => {
    const nextTheme = { ...(theme.newTheme ?? {}) };
    if (nextTheme[theme.mode]) {
      const modeDraft = { ...nextTheme[theme.mode] };
      delete modeDraft.background;
      nextTheme[theme.mode] = modeDraft;
      pruneModeDraft(nextTheme, theme.mode);
    }
    commitThemeDraft(nextTheme);
  }, [commitThemeDraft, pruneModeDraft, theme.mode, theme.newTheme]);

  const handleCopyHex = useCallback((key, value) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value);
    }
    setCopiedHexKey(key);
    window.setTimeout(() => {
      setCopiedHexKey((current) => (current === key ? null : current));
    }, 900);
  }, []);

  const handleDeleteCurrentLocalTheme = useCallback(() => {
    setLocalThemes(
      Object.fromEntries(
        Object.entries(localThemes).filter(([key]) => key !== theme.name),
      ),
    );
    setTheme("default");
    setShowPresetMenu(false);
  }, [localThemes, setLocalThemes, setTheme, theme.name]);

  const handleThemeSelect = useCallback(
    (themeOption) => {
      clearPreviewThemeName();
      setTheme(themeOption.value);
    },
    [clearPreviewThemeName, setTheme],
  );

  const openThemeDuplicateInput = useCallback(() => {
    setNewThemeName(`${theme.name}(copy)`);
    setShowThemeNameInput(true);
  }, [theme.name]);

  useEffect(() => {
    if (!showPresetMenu) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowPresetMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowPresetMenu(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showPresetMenu]);

  const hasAppBasicsChanges = useMemo(() => {
    const isFontChanged =
      theme.newTheme != null &&
      Object.prototype.hasOwnProperty.call(theme.newTheme, "font");
    const isModeChanged = themeMode !== (theme.original.mode ?? "dark");
    return isFontChanged || isModeChanged;
  }, [theme.newTheme, theme.original, themeMode]);

  const hasAppColorsChanges = useMemo(() => {
    const originalModeColors = theme.original[theme.mode].color ?? {};
    return appThemeColorKeys.some(
      (colorVar) => theme.color[colorVar] !== originalModeColors[colorVar],
    );
  }, [appThemeColorKeys, theme.color, theme.mode, theme.original]);

  const hasTimelineChanges = useMemo(
    () =>
      theme.uiScale !== (theme.original.uiScale ?? 1) ||
      theme.size.borderHour !== theme.original.size.borderHour,
    [theme.original, theme.size.borderHour, theme.uiScale],
  );

  const hasMarkerChanges = useMemo(
    () => theme.size.clockHand !== theme.original.size.clockHand,
    [theme.original.size.clockHand, theme.size.clockHand],
  );

  const hasTimespaceColorsChanges = useMemo(() => {
    const originalModeColors = theme.original[theme.mode].color ?? {};
    return timespaceThemeColorKeys.some(
      (colorVar) => theme.color[colorVar] !== originalModeColors[colorVar],
    );
  }, [theme.color, theme.mode, theme.original, timespaceThemeColorKeys]);

  const hasBackgroundChanges = useMemo(() => {
    const originalBackground = theme.original[theme.mode].background ?? {};
    return (
      JSON.stringify(theme.background ?? {}) !==
      JSON.stringify(originalBackground)
    );
  }, [theme.background, theme.mode, theme.original]);

  return {
    theme,
    themeMode,
    activeTab,
    copiedHexKey,
    showThemeNameInput,
    newThemeName,
    showPresetMenu,
    menuRef,
    showTimespaceRenderingControls,
    appThemeColorKeys,
    timespaceThemeColorKeys,
    themesOptions,
    selectedThemeOption,
    hasGlobalChanges: Boolean(theme.newTheme),
    hasAppBasicsChanges,
    hasAppColorsChanges,
    hasTimelineChanges,
    hasMarkerChanges,
    hasTimespaceColorsChanges,
    hasBackgroundChanges,
    setActiveTab,
    setThemeMode,
    setShowThemeNameInput,
    setNewThemeName,
    setShowPresetMenu,
    setNewTheme,
    setThemeColor,
    setThemeUiScale,
    setThemeSize,
    setThemeFont,
    setBackgroundColor,
    resetAppBasics,
    resetAppColors,
    resetTimespaceTimeline,
    resetTimespaceMarker,
    resetTimespaceColors,
    resetBackground,
    handleCopyHex,
    saveTheme,
    handleDeleteCurrentLocalTheme,
    handleThemeSelect,
    openThemeDuplicateInput,
    setPreviewThemeName,
    clearPreviewThemeName,
    committedFont,
    setPreviewFont,
    clearPreviewFont,
  };
}
