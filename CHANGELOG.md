# Changelog

## 0.6.0

Free horizontal scrolling — the day snapping from 0.5.0 is gone.

### Changed

- **Releasing a drag keeps the window exactly where you left it.** The hour
  strip scrolls in whole-hour steps and commits the dragged hours as-is; the
  0.5.0 behavior (spring back / snap to the next day) is removed. The state
  moved from `tzState.viewDayOffset` (whole days) to **`tzState.viewOffsetHours`**
  (hours from today's start in the home zone; set it via
  `setState({ viewOffsetHours })`). `getViewDayStartUtcMs` is replaced by the
  exported `formatHourOffsetLabel`.
- **The "now" line and per-row clocks stay visible on any scrolled window that
  contains the current time** — their position is derived from the window
  start, so they slide with the cells during a pan.
- **A ghost "now" hand on other days**: when the current time is outside the
  viewed window, the hand doesn't disappear — it renders dimmed and glow-less
  at the current wall time projected onto the viewed day, clocks included
  (with a "viewed day is different" tooltip), and still participates in label
  collision resolution.
- **Intervals map onto the scrolled window.** A time-of-day earlier than the
  window's left edge wraps to the next calendar day, so every interval keeps
  exactly one position on the strip; durations are now derived from the
  endpoint times (a seam-straddling interval no longer reads as its
  day-complement, and its min/max arrow is suppressed while it straddles the
  wrap seam). Availability bands are computed for the exact viewed window.
- **The floating pill** now shows the window-start date plus a compact offset
  (`+3h`, `-1d 4h`); ‹ › align to the previous/next real (DST-correct) day
  start — ‹ from a mid-day position first aligns to the viewed day's own
  start — and Today resets to 0.
- **Label collisions resolve on every scroll step**: as the now clock slides
  through a drag, the collision pass re-runs per hour step, so it and the
  row-name block dodge each other live instead of only on release.

## 0.5.0

Horizontal drag-to-pan across days.

### Day paging

- **Drag the hour strip sideways to move between days.** The 24h window
  slides live in whole hours while dragging; the release commits whole
  home-zone days into the new `tzState.viewDayOffset` (0 = today). Every full
  day-width dragged counts, plus one more day when the remainder passes 6
  hours — or on a quick flick. Short slow drags spring back; Escape cancels.
  On touch, `touch-action: pan-y` keeps vertical scrolling native.
- **Day pages are DST-correct**: committed pages start at the actual 00:00 of
  the target calendar day in the home zone (23/25-hour days included), via
  the new `getViewDayStartUtcMs` helper.
- **A floating date pill** (top center) appears on any page other than today:
  `‹ Sat, Aug 8 +7d › Today`, with previous/next/Today controls. Hosts can
  also page programmatically with `setState({ viewDayOffset })`.
- **Hour cells are now derived per-instant.** Labels, weekday/weekend tint,
  day-start markers and past/now shading come from formatting each column's
  actual boundary instant in the row's zone, so half-hour zones and DST
  transition days render their true local hours on every page.
- **"Now" UI stays on today**: the glowing now line and the per-row now
  clocks hide on other day pages (and while panning); their collision box is
  parked off-screen so labels stop dodging a phantom, without flipping the
  row-name side.
- **Anchored overlays fade during a pan** — interval hands, endpoint clocks,
  the duration arrow and availability bands — and return once the page
  settles. Availability is computed for the viewed day, so weekday-dependent
  windows are right on every page.
- New exports: `getViewDayStartUtcMs`, `getStartOfZonedDayUtcMs`,
  `MILLISECONDS_IN_HOUR`; `TimeZonesState` gained `viewDayOffset`.

### Fixes

- Removed the vestigial `-webkit-user-drag: element` on timeline rows: it
  made the whole row a native HTML5 drag source (reorder starts from the
  drag handle's `draggable` attribute), and the native drag cancelled the
  pointer stream of any horizontal gesture on the hour strip.

## 0.4.0

TypeScript declarations in the package, collective clock-label collision, and a
theme-configurator style fix.

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

### Fixes

- **The theme configurator's hover styles no longer crash.** Several rules in
  `theme-config` used Emotion component selectors
  (`${CompactSectionCard}:hover &`), which only compile when
  `@emotion/babel-plugin` runs over the source. The library builds with
  `@vitejs/plugin-react` and no such transform, so interpolating one styled
  component into another's template threw "Component selectors can only be used
  in conjunction with @emotion/babel-plugin" in consuming apps. The affected
  section-card and background-preview rules now key off `data-tsc-*` attributes
  instead, and a test renders them to keep the transform-free path covered.

### Docs & tooling

- The roadmap listed several items that had already shipped — the packaged
  demo site and embed widget, the pre-built `dist/`, multiple simultaneous
  intervals, and the targeted `ResizeObserver`. Dropped, along with the CJS
  build the package deliberately does not do.
- `onSetTimelinesOrder` is documented with its real signature: it takes no
  arguments, and the new order is read from `timeLines` on the context.
- README links the published package from its badges and Install section, and
  lists yarn/pnpm alongside npm.
- Runtime dependencies are declared as caret ranges instead of exact pins, so a
  host app that already has Emotion (or `prop-types`) resolves one shared copy
  rather than installing a nested duplicate. Dev dependencies follow suit.

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
