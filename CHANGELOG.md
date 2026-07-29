# Changelog

## Unreleased

### Collision resolution

- Clock labels for every visible interval now participate in one collective
  collision pass. Overlapping endpoints from different intervals receive
  independent side and stack-lane layouts instead of inheriting the first
  interval's `xPos1`/`xPos2` layout.

### TypeScript types

- **Declarations ship with the package.** `react-timespace` and
  `react-timespace/theme-config` both resolve types with no `@types/…`
  install, under `bundler`, `node16` and `nodenext` module resolution. The
  `exports` map gained `types` conditions and the manifest a top-level
  `types` field, in both the committed (source) and `publishConfig` (dist)
  variants.
- The runtime stays JavaScript with `prop-types`, so the `.d.ts` files are
  hand-written. `npm run typecheck` compiles them against `types/smoke.tsx`,
  which imports every public export the way a consumer would; it runs as part
  of `prepublishOnly`, so a signature that drifts from the implementation
  fails before publish.
- Exported types cover the resources (`TimeLine`, `TimeInterval`,
  `Availability`), the component and its slots (`TimespaceProps`,
  `PlaceSelectorArgs`, `LineHighlight`, `TimeZoneOption`), state
  (`TimeZonesState`, `TimeZonesContextValue`, `TimeZonesClockContextValue`),
  theming (`TimespaceTheme`, `ThemePreset`, `ThemeMode`) and availability
  (`AvailabilityCell`, `AvailabilitySegment`).
- `TimeLine` and `TimeInterval` carry an index signature so host apps can hang
  their own fields off a resource without casting — the reducer stores them
  verbatim either way.
- Emotion's `Theme` is left un-augmented; the README shows the one-liner for
  apps that want `useTheme()` to know the Timespace keys.
- The source-only subpaths (`./theming`, `./tzOptions`, `./state/*`) get
  declarations too, so linked checkouts and monorepos type-resolve as well.
  They stay out of the tarball, which still exposes `.` and `./theme-config`.

### Docs

- The roadmap listed several items that had already shipped — the packaged
  demo site and embed widget, the pre-built `dist/`, multiple simultaneous
  intervals, and the targeted `ResizeObserver`. Dropped, along with the CJS
  build the package deliberately does not do.
- `onSetTimelinesOrder` is documented with its real signature: it takes no
  arguments, and the new order is read from `timeLines` on the context.

## 0.3.0

Availability windows, plus a split between view settings and theming.

- **Per-timeline availability**: a timeline can declare an `availability`
  window — `{ start: "08:00", end: "21:00" }`, an array of windows, or an
  overnight window that wraps midnight. Times are local to that timeline's
  `timeZone`; the row shades its available hours green.
- **Cross-time-zone overlap**: when two or more rows declare availability,
  the instants every declared window shares get a stronger highlight, so the
  time that works for everyone is visible at a glance. Timelines without an
  `availability` value sit out of the overlap calculation.
- Availability is projected onto the home-zone day with a DST-safe zoned-day
  conversion, sampled per minute, and recomputed only when the home-zone date
  changes (not on every clock tick).
- `calculateAvailabilityGrid`, `normalizeAvailability` and `isMinuteAvailable`
  are exported for hosts that want the same math (e.g. to propose slots).

### Breaking

- **`ThemeConfig` no longer renders view preferences.** The Timespace display
  section is gone, along with the `showGroupTimelinesControl`, `prefs` and
  `onPrefsChange` props (and the internal `ThemeConfigTimespaceDisplay`). The
  configurator now themes the widget and nothing else; hosts present clock /
  seconds / time-format / grouping preferences on their own settings surface
  and pass them to `Timespace` through its display props. Passing the removed
  props is a no-op — remove them and move the controls.

### Fixes

- **No phantom scrollbar**: the now-line glow and the day-start divider no
  longer bleed past their row. Both were scrollable overflow below the last
  row, so `TimeLineList` (and an embedding iframe) grew a scrollbar with
  nothing to scroll even when every row fit exactly.
- **Linked/source consumers resolve subpaths again**: the committed `exports`
  map points at the source entry points, so `npm link` and monorepo checkouts
  can import `react-timespace/theming`, `/tzOptions` and `/state/*` with no
  build step. A `prepack`/`postpack` pair swaps in the `dist` map while the
  tarball is built, so the published package is unchanged — npm ignores
  `publishConfig` field overrides, which would have shipped 0.3.0 pointing at
  sources the tarball doesn't contain.

### Docs & tooling

- README documents availability, the embed sandbox at
  [synccontact.com/timespace-embed](https://synccontact.com/timespace-embed),
  and the embed's zen-by-default behaviour (`data-zen="0"` to opt out, plus
  the corner toggle a visitor can flip for themselves).
- `embed-test/` gains a host-page CSP harness that exercises the widget under
  strict content-security policies, and the direct-iframe preset now resizes
  from the height handshake.

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

Packaging — this is the first version published to npm.

- The package is **pre-built** (`npm run build`, Vite library mode) instead of
  shipping raw JSX, so bundlers that don't transpile `node_modules` (webpack,
  Next.js) can consume it. Output is ESM with source maps; `react`,
  `react-dom`, Emotion, `lucide-react`, `prop-types` and `react-colorful` stay
  external so the app resolves a single copy of each.
- `exports` map with two entries: `react-timespace` and
  `react-timespace/theme-config`, sharing one chunk so both see the same React
  context instances.
- `"use client"` banner for React Server Component consumers.
- Fixed a crash when the package was imported without a DOM (SSR): a
  `PropTypes.instanceOf(Element)` was evaluated at module load.

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
