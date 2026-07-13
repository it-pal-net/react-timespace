# Changelog

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
