# Changelog

## 0.2.1

Time-interval drag rework — reliability, hit targets, and performance.

- **Pointer-events drag**: interval resize/move now starts from `pointerdown`
  and is tracked with window-level `pointermove`/`pointerup` (replaces the
  HTML5 `draggable`+`preventDefault` hack and the list-scoped mouse handlers).
  Drags no longer freeze when the cursor leaves the list, drops outside the
  component are never missed, and touch/pen input works.
- **16px grab strips**: each interval hand renders an invisible full-height
  hit strip (was: the bare 3px line, header-only), with a hover highlight
  band, hand brightening, and `ew-resize` cursor.
- **Whole duration arrow is draggable** for moving the range (was: only the
  small duration text), with `grab`/`grabbing` cursors.
- **Crisp hands across rows**: within-row interval segments now span the full
  row (same pattern as the now-line) instead of the header only, so hands no
  longer look dimmed/blurred behind the rows' frosted-glass background.
- **Less drag lag**: `TimeLine` (24 hour cells per row) is memoized; drag
  handlers are referentially stable; duration label is computed from the
  updated endpoint (was one frame stale).
- **Move snapping + flush clamping**: moving the range snaps its leading edge
  to the interval step (Ctrl/Cmd = 1s, Shift = 5m — modifiers now read from
  the pointer event, so they can't get stuck) and clamps flush against the
  timeline edges.
- **Escape cancels a drag**, restoring positions from drag start;
  `pointercancel`/window `blur` end it safely.

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
