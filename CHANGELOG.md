# Changelog

## 0.2.0

Theming engine + theme configurator (extracted from SyncContact).

- `themePresets` — 15 built-in themes (dracula, nord, gruvbox, …) +
  `colorLabels`
- `Timespace` accepts `theme` (preset name or object) and `themeMode` props;
  `resolveTheme()` exported for manual use
- `TimespaceThemeProvider` — localStorage-persisted theme selection, saved
  user themes, unsaved-draft overlay and hover-preview context
  (`useThemePreview`)
- `react-timespace/theme-config` — opt-in theme configurator UI (preset
  picker, mode toggle, Google-Font combobox, color rows with hex/alpha,
  sizing sliders, background fill, save/rename/delete). Host component slots:
  `Select`, `Input`, `GradientPicker`, `ImagePicker`; styled via `--tsc-*`
  tokens that inherit host CSS variables with standalone fallbacks
- New dependency: `react-colorful`
- Demo: 🎨 Theme panel showcasing the configurator

## 0.1.0

Initial extraction from the SyncContact monorepo
(`packages/components/TimeLine`).

- `Timespace` component (multi-timezone timelines + draggable intervals)
- `TimespaceProvider` state layer (context + reducer, timeline/interval
  actions)
- Host-app slots: `renderLineItems`, `getLineHighlight`,
  `renderPlaceSelector`, `onAddCalendarEvent`, `formatDuration`
- Default theme (`defaultTimespaceTheme`) — renders with no host providers
- Pure, unit-tested core: coordinate math, label collision resolver, reorder
  preview
