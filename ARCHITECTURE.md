# Timespace architecture

Timespace renders multiple time zones as horizontal timelines and overlays
interactive "time interval" handles you can drag to select a range.

## What Timespace is responsible for

- **Rendering** a list of timelines (`timeLines`) with hour ticks
  (`TimeLine.jsx`).
- **Rendering** "now" clock labels for each timeline (home clock) and for each
  interval endpoint.
- **Dragging**:
  - reorder timelines (native HTML5 drag & drop + ghost overlay)
  - resize interval endpoints (pointerdown on a 16px grab strip centered on
    each hand, then window-level pointermove/pointerup)
  - move the whole interval range (drag the duration arrow — line or text)
  - scroll the 24h window (pointerdown on the hour strip, hour-stepped live
    preview, the dragged hours commit as-is on release)
- **Measurement & geometry**:
  - measure list/header/hour widths and offsets
  - convert between pixels and "seconds from start of day"
- **Collision resolution**:
  - prevent the floating clock labels (and the header name block) from
    overlapping and from going out of bounds.

## Data model (from `TimeZonesContext`)

Timespace reads and writes state via `TimeZonesContext`, provided by
`TimespaceProvider` (`state/timeZonesProvider.jsx`) — a plain React context +
reducer, no external state library.

### `timeLines[]`

Each timeline row represents a place/timezone.

Common fields used by the UI:

- **`id`**: timeline id
- **`name`**: display label
- **`timeZone`**: IANA zone id
- **`color`**: optional color used for text/border
- **`contacts`**: map of items shown via the `renderLineItems` slot
- **`mode`**: e.g. `"edit"` to show the place selector
- **`isLocked`**: optional; affects sticky behavior

### `timeIntervals[]`

Timespace resolves all visible interval endpoints together with the live clock
and row-name block. Each endpoint receives its own side and vertical stack
lane, keyed by interval id.

Common fields used by the UI:

- **`id`**: interval id
- **`mode`**: `"fixed" | "resize" | "move" | "float"`
- **`actionPoint`**: `"xPos1" | "xPos2" | null` (which endpoint is being dragged)
- **`xPos1` / `xPos2`**: pixel positions for endpoints (absolute, relative to
  viewport calculations)
- **`xPos1DayOffsetSeconds` / `xPos2DayOffsetSeconds`**: seconds-from-day-start
  (source of truth for restoring positions)
- **`xPos1ClockSide` / `xPos2ClockSide`**: `"left" | "right"` where the clock
  label should render
- **`xPos1ClockCollide` / `xPos2ClockCollide`** + `*CollideIndex`: collision
  metadata used for stable stacking
- **derived**: `durationPixels`, `durationSeconds`, `durationHuman`

## Coordinate system (pixels ↔ seconds)

Timespace uses a measured `hoursLineWidth` to map a day to the horizontal axis:

- **seconds → pixels**: `seconds / 86400 * hoursLineWidth` (+ measured offsets)
- **pixels → seconds**: `pixels / hoursLineWidth * 86400` (minus offsets)

These conversions live in `core/timeLineMath.js` and are used by drag hooks to
persist `*DayOffsetSeconds`.

## Key modules & hooks

- **`hooks/useTimeLineMeasurements.js`**
  - owns DOM refs and measurements: list offsets, widths, sample clock widths
  - re-measures on resize + DOM mutations

- **`core/timeLineMath.js`**
  - pure helpers: duration calculation, top-offset/font-size helpers, day
    constants, `formatDurationShort`

- **`core/timeLineCollision.js`**
  - pure-ish collision resolver: builds "boundary boxes" for every interval,
    switches sides, computes collision index lists and assigns stack lanes

- **`core/timelineReorderPreview.js`**
  - pure helpers for the row-reorder ghost preview

- **`hooks/useTimeLineCollisionResolution.js`**
  - applies collision output:
    - updates `colliderState` (with idempotent guard)
    - patches interval collision fields in context (only if changed)

- **`hooks/useTimeLineAutoCollision.js`**
  - runs the "auto collision pass" when time progresses / sizes change:
    - chooses `timeLineName.side` based on current time position
    - recalculates interval x positions from `*DayOffsetSeconds`
    - runs collision + apply

- **`hooks/useTimeIntervalDrag.js`**
  - owns interval dragging (resize/move/float placement) and snapping
  - pointer events: drags start from `pointerdown` on a grab surface and are
    tracked with window-level `pointermove`/`pointerup` listeners, so the drag
    survives the cursor leaving the list and the drop is never missed;
    `pointercancel`/window `blur` also end the drag; Escape cancels and
    restores drag-start positions
  - reads snap modifiers (Ctrl/Cmd/Shift) from the pointer event itself
  - throttles moves to one per `requestAnimationFrame`; latest render values
    are read through a ref so the window handlers stay referentially stable

- **`hooks/useTimelineReorderDnD.js`**
  - owns timeline reorder drag & drop + ghost overlay (appended into
    `portalContainer`, falling back to `#content` then `document.body`)

- **`hooks/useTimelinePan.js`**
  - owns horizontal drag-scrolling of the 24h window (same window-listener
    pattern as interval drags; Escape cancels)
  - while dragging, `panHours` shifts the rendered window in whole hours; the
    release adds exactly those hours to `tzState.viewOffsetHours` — no
    snapping, the window stays where it was dropped

- **`state/timeZonesProvider.jsx`**
  - the provider: resource reducer (timeLines/timeIntervals), a
    boundary-aligned ticker, per-zone `Intl.DateTimeFormat` clocks and offsets

## Scrolling through time (`viewOffsetHours`)

The timeline always renders a 24h window. `tzState.viewOffsetHours` (0 =
today's start in the home zone) says how many hours the window is scrolled;
during an active pan the transient `panHours` shifts it further. Hour labels,
weekday/day-start markers and past/now shading are all derived per-cell from
the actual boundary instants (`TimeLine` formats each column's instant in the
row's zone), so any window — including one spanning two days or a DST
transition — renders its true local hours.

The "now" line and per-row clocks are positioned relative to the window start
(`TimespaceClockSync`), so they slide with the cells. When the current time
is inside the window they render live; when it is outside they become a
dimmed **ghost** — the current home-zone wall time projected onto the viewed
day (`getNowHandWindowFraction`), aligned with the hour labels and wrapped so
the hand always sits somewhere on the strip. Live or ghost, the hand's clock
participates in collision resolution, so row names keep dodging it.

Interval times-of-day map onto the window through
`getXPosFromDayOffset(…, viewOffsetSeconds)`: a time earlier than the
window's left edge wraps to the next calendar day, so every interval keeps
exactly one strip position. An interval that straddles the wrap seam renders
its endpoints in swapped pixel order — the min/max duration arrow is
suppressed in that state, and durations are derived from the endpoint times
(never the pixel span) so they survive any view. While panning, interval
hands/clocks, the duration arrow and availability bands fade out (they are
anchored to the committed offset) and return on release; availability is
recomputed for the exact committed window.

A floating pill (top center) shows the window-start date plus a compact
offset label whenever the window is scrolled; ‹ › jump to the previous/next
real (DST-correct) day start via `getAdjacentDayStartOffsetHours`, and Today
resets to 0.

## Interaction rules (UX)

### Scrolling

- drag anywhere on an hour strip (cursor: `grab`); headers, clocks, interval
  grab strips and the row drag handle keep their own gestures
- the strip follows in one-hour steps and the release commits exactly the
  dragged hours — no snapping, no spring-back (drags under half an hour-width
  round to zero)
- Escape cancels and restores the pre-drag offset; on touch, `touch-action:
  pan-y` keeps vertical list scrolling native

### Interval snapping

While dragging an endpoint:

- **default**: snap to `tzState.intervalStepSeconds`
- **Ctrl/Cmd**: snap to 1 second
- **Shift**: snap to 5 minutes

Moving the whole range snaps its leading edge with the same modifiers while
keeping the pixel range exact, and clamps flush against the timeline edges.

### Move range

Dragging the duration arrow (the invisible thick stroke over the line, or the
text) moves both endpoints together.

### Creating an interval

If an interval only has one endpoint, pointerup will auto-create a second
endpoint at a default range (2 hours).

### Grab surfaces

Each interval hand renders an invisible 16px-wide `IntervalHitStrip` over its
full height (tails included), with a soft highlight band on hover and
`ew-resize` cursor. The within-row hand segments (`TimeLineRow`) are purely
visual (`pointer-events: none`); all pointer interaction goes through the
strips and the duration arrow.

## Dependencies / assumptions

- Collision + measurement depend on actual DOM sizes (it's not a "pure canvas"
  widget) — so no SSR: render it client-side.
- The provider persists a few user prefs (`timeFormat`,
  `showTimezoneAbbreviation`, `showSeconds`) to `localStorage`; the display
  props override storage when set.

## Debugging tips

- If clock labels overlap or jump:
  - check measurements in `useTimeLineMeasurements` (especially
    `maxHeaderWidth`, `timeZonesClockWidth`, `timeIntervalClockWidth`)
  - check collision output from `resolveTimeLineCollisions`

- If dragging feels "heavy":
  - most expensive work is the collision pass + context updates
  - `useTimeIntervalDrag` throttles pointermove to 1/frame; ensure no
    additional expensive rerenders are triggered elsewhere
  - `TimeLine` (the 24 hour cells per row) is memoized — keep its props stable
    during drags or every frame re-renders every cell again

## Future improvements (high value)

- **Replace `MutationObserver(document.body)`** with a targeted
  `ResizeObserver` on the list/header container (less global, fewer recalcs).
- **DND**: consider switching to a library like `@dnd-kit` to remove DOM
  cloning and simplify reorder logic.
- **Ultra-smooth interval dragging (commit-on-mouseup)**: keep a local "draft
  interval" during drag, render from that draft, and only commit to context on
  `mouseup` (optionally at a low frequency while dragging).
- **Accessibility**: keyboard controls for interval endpoints, focus
  management and aria labels for draggable elements.
