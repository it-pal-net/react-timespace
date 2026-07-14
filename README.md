# react-timespace

A multi-timezone timeline for React. Render the day as horizontal timelines —
one per time zone — and drag a shared **time interval** across them to plan
meetings, hand-offs, or focus blocks that work for everyone.

Extracted from (and battle-tested in) [SyncContact](https://synccontact.com),
where it powers the Time Zones view.

**Live demo:** <https://synccontact.com/timespace> · or embed it anywhere
with one script tag (see [Embedding](#embedding)).

## Features

- **One row per time zone** with hour ticks, live clocks, and a glowing
  "now" hand that moves through the day.
- **Draggable time intervals**: resize either endpoint, or drag the duration
  arrow to move the whole range. Snapping: default to a configurable step,
  `Ctrl/Cmd` for 1s, `Shift` for 5 minutes.
- **Collision-resolved labels**: floating clock labels and row names
  automatically flip sides, stack, and scale so they never overlap — driven
  by a deterministic, unit-tested collision resolver.
- **Row reordering** via native HTML5 drag & drop with a ghost preview.
- **Time-zone deltas** ("+7h" relative to home or local zone), home-zone
  marker, timezone abbreviations, optional seconds.
- **Slots for host-app integration**: render your own items on a line
  (contacts, avatars…), your own place picker, and hook interval scheduling
  into your calendar flow.
- Ships with a **default theme** and works with no providers beyond its own.

## Install

```sh
npm install react-timespace
```

React 18+ is a peer dependency. Styling uses Emotion (bundled as a regular
dependency — your app does not need to use Emotion).

## Quick start

```jsx
import { Timespace, TimespaceProvider, setTimelines } from "react-timespace";
import { useContext, useEffect } from "react";
import { TimeZonesContext } from "react-timespace";

function Zones() {
  const { tzDispatch } = useContext(TimeZonesContext);

  useEffect(() => {
    tzDispatch(
      setTimelines([
        {
          id: "nyc",
          orderId: 0,
          name: "New York",
          timeZone: "America/New_York",
        },
        { id: "berlin", orderId: 1, name: "Berlin", timeZone: "Europe/Berlin" },
        {
          id: "bangkok",
          orderId: 2,
          name: "Bangkok",
          timeZone: "Asia/Bangkok",
        },
      ]),
    );
  }, []);

  return <Timespace />;
}

export default function App() {
  return (
    <TimespaceProvider>
      <div style={{ height: 400 }}>
        <Zones />
      </div>
    </TimespaceProvider>
  );
}
```

State lives in `TimespaceProvider` (a plain React context + reducer). Your
app reads and writes it with the exported actions (`setTimelines`,
`addTimeline`, `updateTimeline`, `deleteTimeline`, `addTimeInterval`, …)
through `tzDispatch` from `TimeZonesContext`.

## Key props

| Prop                                                          | Type                            | Purpose                                                                                       |
| ------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| `renderLineItems(timeLine)`                                   | slot                            | Render custom content on a row (e.g. people pinned to that zone)                              |
| `getLineHighlight(timeLine)`                                  | fn → `"focus" \| "dim" \| null` | Emphasize/de-emphasize rows                                                                   |
| `renderPlaceSelector({ timeLine, height, onSelect, onBlur })` | slot                            | Replace the built-in time-zone select with your own place search                              |
| `handleAddTimelinePlace(timeLine, option)`                    | callback                        | Persist a picked place; omit to let the built-in select update state directly                 |
| `handleDeleteTimeline(timeLine)`                              | callback                        | Row delete button handler                                                                     |
| `onSetTimelinesOrder(timeLines)`                              | callback                        | Persist row order after drag & drop                                                           |
| `onAddCalendarEvent(timeInterval)`                            | callback                        | Show the calendar button on intervals and handle scheduling                                   |
| `formatDuration(seconds)`                                     | fn → string                     | Override the `"1h 30m"` duration formatting (i18n)                                            |
| `showTimezoneAbbreviation` / `showSeconds`                    | bool                            | Display options (default to localStorage-backed settings)                                     |
| `deltaBase`                                                   | `"home" \| "local"`             | Base zone for the per-row `+7h` delta labels                                                  |
| `theme` (via Emotion `ThemeProvider`)                         | object                          | Override `defaultTimespaceTheme` keys (`uiScale`, `mode`, `color.intervalHandBody`, `size.*`) |
| `portalContainer`                                             | element                         | Host element for the row-drag ghost overlay                                                   |
| `recomputeCollisionsKey`                                      | number                          | Bump to force a collision/layout recompute after external changes                             |

## Embedding

Don't use React? Drop the hosted widget into any page:

```html
<script
  src="https://synccontact.com/timespace/embed.js"
  data-zones="Europe/Berlin,America/New_York,Asia/Bangkok"
  data-theme="dark"
  defer
></script>
```

The loader injects an iframe right after the script tag and keeps its height
in sync. Attributes: `data-zones` (comma-separated IANA ids), `data-theme`
(`light` | `dark`), `data-height` (initial px height).

## Local development

```sh
npm install        # package deps + vitest
npm test           # pure-core unit tests
cd demo && npm install && npm run dev   # local playground on vite
```

The hosted playground lives at
[synccontact.com/timespace](https://synccontact.com/timespace); `demo/` is
the same experience for local development against your working copy.

## Architecture

The interesting parts — the px ↔ seconds coordinate system, the label
collision resolver, and the drag machinery — are documented in
[ARCHITECTURE.md](./ARCHITECTURE.md). The pure math lives in `core/` and is
unit-tested (`npm test`).

## Status & roadmap

Early extraction (0.x): the API may still move. Planned:

- packaged demo site + embeddable widget
- pre-built ESM/CJS dist + TypeScript types
- multiple simultaneous intervals
- keyboard a11y for interval endpoints
- targeted `ResizeObserver` instead of body-level mutation observation

Issues and PRs welcome.

## License

[MIT](./LICENSE)
