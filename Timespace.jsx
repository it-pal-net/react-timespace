import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  useContext,
} from "react";
import PropTypes from "prop-types";
import { useTheme, ThemeProvider } from "@emotion/react";

import { TimeZonesContext, useTimeZonesClock } from "./state/timeZonesProvider";
import useLocalStorage from "./hooks/useLocalStorage";
import {
  deleteTimeInterval,
  updateTimeInterval,
  setState,
} from "./state/actions";

import TimeLineRow from "./TimeLineRow";
import TimeIntervalMarker, { VerticalMarker } from "./TimeIntervalMarker";
import DurationArrow from "./DurationArrow";
import * as S from "./styled";
import useTimeLineMeasurements from "./hooks/useTimeLineMeasurements";
import useTimelineReorderDnD from "./hooks/useTimelineReorderDnD";
import useTimelinePan from "./hooks/useTimelinePan";
import useTimeIntervalDrag, {
  getResizeTargetPosKey,
} from "./hooks/useTimeIntervalDrag";
import useTimeLineCollisionResolution from "./hooks/useTimeLineCollisionResolution";
import useTimeLineAutoCollision from "./hooks/useTimeLineAutoCollision";
import TimespaceClockSync from "./TimespaceClockSync";
import TimeLineRowClocksSync from "./TimeLineRowClocksSync";
import resolveTimeLineCollisions from "./core/timeLineCollision";
import {
  calculateDurationData,
  formatDeltaToLocal,
  formatHourOffsetLabel,
  getAdjacentDayStartOffsetHours,
  getStartOfZonedDayUtcMs,
  getTimeZoneOffsetSecondsSafe,
  getXPosFromDayOffset,
  getSecondsFromStartOfDay,
  MILLISECONDS_IN_DAY,
  MILLISECONDS_IN_HOUR,
  SECONDS_IN_DAY,
} from "./core/timeLineMath";
import {
  labelTailHeight,
  clockXTransformPercent,
  zIndexFloors,
  backdropFilter,
  intervalPosKeys,
  dayNavRowGap,
} from "./constants";
import { withThemeDefaults } from "./theme";
import resolveTheme from "./theming/resolveTheme";
import { calculateAvailabilityGrid } from "./core/availability";

const defaultColliderState = {
  side: "right",
  isCollided: null,
  fontSize: "1em",
  zIndex: zIndexFloors.head,
  top: 0,
  scale: 1,
};

const Timespace = ({
  handleAddTimelinePlace,
  handleDeleteTimeline,
  onSetTimelinesOrder,
  measureElRef,
  renderLineItems,
  getLineHighlight,
  renderPlaceSelector,
  showTimezoneAbbreviation: showTimezoneAbbreviationProp,
  showSeconds: showSecondsProp,
  // Distraction-free rows: keep the name, clock and hour strip; drop the
  // delete control, contacts/place badge, home marker, delta-to-home and tz
  // abbreviation. Backward-compatible (off by default).
  minimal = false,
  deltaBase = "home",
  formatDuration,
  onAddCalendarEvent,
  recomputeCollisionsKey = 0,
  portalContainer,
  theme: themeProp,
  themeMode,
}) => {
  const rootElRef = useRef(null);
  const outerTheme = useTheme();
  const theme = useMemo(
    () =>
      withThemeDefaults(
        resolveTheme(themeProp, { mode: themeMode }) ?? outerTheme,
      ),
    [outerTheme, themeProp, themeMode],
  );
  const { tzState, tzDispatch, timeLines, timeIntervals } =
    useContext(TimeZonesContext);
  const clockCtx = useTimeZonesClock();
  const timeZonesClock = clockCtx?.timeZonesClock ?? {};
  const nowDate = new Date((clockCtx?.timer ?? Date.now() / 1000) * 1000);
  // A stable day-level key so day-boundary math only recomputes at midnight.
  const homeDayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: tzState.homeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(nowDate);

  // How far the viewed 24h window is scrolled from the start of today in the
  // home zone, in hours. Drag-panning previews further hours on top of this
  // and commits exactly what was dragged on release — no day snapping.
  const viewOffsetHours = tzState.viewOffsetHours ?? 0;
  const todayStartUtcMs = useMemo(
    () => getStartOfZonedDayUtcMs(tzState.homeZone, nowDate),
    [tzState.homeZone, homeDayKey],
  );
  const committedViewStartUtcMs =
    todayStartUtcMs + viewOffsetHours * MILLISECONDS_IN_HOUR;

  // Seconds into its home-zone day at the committed window's left edge —
  // the strip origin for mapping interval times-of-day onto columns.
  const viewOffsetSeconds = useMemo(() => {
    if (!viewOffsetHours) {
      return 0;
    }
    const viewedDayStartUtcMs = getStartOfZonedDayUtcMs(
      tzState.homeZone,
      new Date(committedViewStartUtcMs),
    );
    return (committedViewStartUtcMs - viewedDayStartUtcMs) / 1000;
  }, [tzState.homeZone, committedViewStartUtcMs, viewOffsetHours]);

  const availabilityGrid = useMemo(
    () =>
      calculateAvailabilityGrid(
        timeLines,
        tzState.homeZone,
        nowDate,
        committedViewStartUtcMs,
      ),
    [timeLines, tzState.homeZone, committedViewStartUtcMs],
  );

  const [showTimezoneAbbreviationStored] = useLocalStorage(
    "showTimezoneAbbreviation",
    false,
  );
  const showTimezoneAbbreviation =
    typeof showTimezoneAbbreviationProp === "boolean"
      ? showTimezoneAbbreviationProp
      : showTimezoneAbbreviationStored;
  // Controlled hosts (URL-driven playground) pass showSeconds as a prop;
  // uncontrolled hosts (the app) read it from localStorage.
  const [showSecondsStored] = useLocalStorage("showSeconds", false);
  const showSeconds =
    typeof showSecondsProp === "boolean" ? showSecondsProp : showSecondsStored;
  const [isNowXPosReady, setIsNowXPosReady] = useState(false);

  const {
    size,
    refs: {
      listElRef,
      firstTimelineElRef,
      firstHeaderElRef,
      firstHoursElRef,
      timeIntervalClockSampleElRef,
      timeZonesClockSampleElRef,
    },
  } = useTimeLineMeasurements({
    timeLinesLength: timeLines.length,
    timeIntervalsLength: timeIntervals.length,
    uiScale: theme.uiScale,
    measureElRef,
    // Force re-measure when the clock format changes in a way that affects width.
    // (ResizeObserver won't fire because box size doesn't change.)
    // Even when seconds are "off", we show them on hover (now label / home-now cell),
    // so measure as-if seconds are present to avoid layout jitter on hover.
    invalidateKey: "with-seconds",
  });

  const {
    transparentDragImageRef,
    handleDragStartTimeLine,
    handleDragTimeLine,
    handleDragOverTimeLineList,
    handleDragEndTimeLine,
    handleDropTimeLine,
  } = useTimelineReorderDnD({
    timeLines,
    portalContainer,
    timeLinesMap: tzState.timeLinesMap,
    tzDispatch,
    onSetTimelinesOrder,
    size,
    backdropFilter,
    zIndexFloors,
    cssVarSourceElRef: rootElRef,
    listElRef,
  });

  const deltaBaseZone =
    deltaBase === "home"
      ? tzState.homeZone
      : (tzState.localZone ?? tzState.homeZone);
  const deltaToLocalByZone = useMemo(() => {
    const now = new Date();
    const localOffsetSeconds =
      timeZonesClock?.[deltaBaseZone]?.timeZoneOffsetSeconds ??
      getTimeZoneOffsetSecondsSafe(deltaBaseZone, now);
    if (localOffsetSeconds == null) {
      return {};
    }

    return timeLines.reduce((acc, tl) => {
      const targetOffsetSeconds =
        timeZonesClock?.[tl.timeZone]?.timeZoneOffsetSeconds ??
        getTimeZoneOffsetSecondsSafe(tl.timeZone, now);
      const deltaSeconds =
        targetOffsetSeconds == null
          ? null
          : targetOffsetSeconds - localOffsetSeconds;

      const label = formatDeltaToLocal(deltaSeconds);
      if (label) {
        acc[tl.timeZone] = label;
      }
      return acc;
    }, {});
  }, [timeZonesClock, deltaBaseZone, timeLines]);

  const [colliderTrigger, setColliderTrigger] = useState(0);
  const [colliderState, setColliderState] = useState({
    timeZonesClock: defaultColliderState,
    timeLineName: {
      ...defaultColliderState,
      side: "left",
    },
    timeIntervals: {},
  });

  const homeDayPassedXPosRef = useRef(0);

  const requestCollisionResolution = useCallback(() => {
    setColliderTrigger((current) => current + 1);
  }, []);

  const handleCommitViewOffsetHours = useCallback(
    (nextOffsetHours) => {
      tzDispatch(setState({ viewOffsetHours: nextOffsetHours }));
      // Interval positions and the now line move with the window; re-run
      // label layout against the new offset.
      requestCollisionResolution();
    },
    [requestCollisionResolution],
  );

  const { panHours, isPanning, handlePanPointerDown } = useTimelinePan({
    size,
    viewOffsetHours,
    onCommitViewOffsetHours: handleCommitViewOffsetHours,
  });

  // First column of the rendered 24h window: the committed scroll position
  // plus the in-flight drag preview (whole hours).
  const viewStartUtcMs =
    committedViewStartUtcMs + panHours * MILLISECONDS_IN_HOUR;
  const nowMs = nowDate.getTime();
  const isNowInView =
    nowMs >= viewStartUtcMs && nowMs < viewStartUtcMs + MILLISECONDS_IN_DAY;
  // Once measured, the hand always renders: live on the window that contains
  // "now", as a dimmed ghost (current wall time projected onto the viewed
  // day) everywhere else.
  const showNowMarker = isNowXPosReady;
  const isNowGhost = !isNowInView;
  const effectiveOffsetHours =
    (viewStartUtcMs - todayStartUtcMs) / MILLISECONDS_IN_HOUR;

  // Like viewOffsetSeconds, but for the effective (mid-pan) window — the
  // ghost hand anchors to it so it stays aligned with the hour labels while
  // dragging.
  const effectiveViewOffsetSeconds = useMemo(() => {
    if (viewStartUtcMs === todayStartUtcMs) {
      return 0;
    }
    const viewedDayStartUtcMs = getStartOfZonedDayUtcMs(
      tzState.homeZone,
      new Date(viewStartUtcMs),
    );
    return (viewStartUtcMs - viewedDayStartUtcMs) / 1000;
  }, [tzState.homeZone, viewStartUtcMs, todayStartUtcMs]);

  // The now clock/line slides with the window while panning (CSS var), but
  // its side/stacking and the row-name side come from the collision pass —
  // re-run it on every window move (each hour step of a drag included) so
  // the labels dodge each other live, not only on release. Runs one commit
  // after TimespaceClockSync has written the new now position into
  // homeDayPassedXPosRef, so the pass reads the fresh x.
  useEffect(() => {
    requestCollisionResolution();
  }, [viewStartUtcMs, requestCollisionResolution]);

  const viewDayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: tzState.homeZone,
    }).format(new Date(viewStartUtcMs));
  }, [viewStartUtcMs, tzState.homeZone]);

  // Live or ghost, the hand is always somewhere on the strip (TimespaceClockSync
  // wraps the position into the window), so labels dodge its clock as usual.
  const getEffectiveNowXPos = () => homeDayPassedXPosRef.current;

  const calculatePositionFromDayOffset = useCallback(
    (secondsOffsetFromDay) =>
      getXPosFromDayOffset(secondsOffsetFromDay, size, viewOffsetSeconds),
    [size, viewOffsetSeconds],
  );

  const calculateSecondsFromStartOfDay = useCallback(
    (xPos) => getSecondsFromStartOfDay(xPos, size, viewOffsetSeconds),
    [size, viewOffsetSeconds],
  );

  const collider = useCallback(
    ({ timeIntervals: intervals, timeZonesClock, timeLineName }) =>
      resolveTimeLineCollisions({
        timeIntervals: intervals,
        timeZonesClock,
        timeLineName,
        size,
        homeDayPassedXPos: getEffectiveNowXPos(),
        clockXTransformPercent,
      }),
    [size],
  );

  const { applyCollisionResolution } = useTimeLineCollisionResolution({
    size,
    zIndexFloors,
    setColliderState,
    tzState,
    tzDispatch,
    updateTimeInterval,
  });

  useTimeLineAutoCollision({
    homeDayPassedXPos: getEffectiveNowXPos(),
    size,
    timeIntervals,
    colliderState,
    setColliderState,
    calculatePositionFromDayOffset,
    calculateDurationData,
    formatDuration,
    collider,
    applyCollisionResolution,
    colliderTrigger: colliderTrigger + recomputeCollisionsKey,
  });

  const { handlePointerMove, handlePointerUp, handleDragStartTimePoint } =
    useTimeIntervalDrag({
      tzState,
      tzDispatch,
      timeIntervals,
      size,
      formatDuration,
      secondsInDay: SECONDS_IN_DAY,
      collider,
      colliderState,
      applyCollisionResolution,
      calculateSecondsFromStartOfDay,
      calculatePositionFromDayOffset,
      calculateDurationData,
      updateTimeInterval,
      requestCollisionResolution,
    });

  const handleSetHomeZone = useCallback((timeZoneName) => {
    tzDispatch(
      setState({
        homeZone: timeZoneName,
      }),
    );
  }, []);

  const handleDeleteTimePoint = (timePoint, xPos) => {
    if (
      (xPos === "xPos1" && timePoint.xPos2 === null) ||
      (xPos === "xPos2" && timePoint.xPos1 === null)
    ) {
      tzDispatch(deleteTimeInterval(timePoint.id));
    } else {
      tzDispatch(
        updateTimeInterval({
          id: timePoint.id,
          [xPos]: null,
          [`${xPos}DayOffsetSeconds`]: null,
        }),
      );
    }
    requestCollisionResolution();
  };

  // The "2h" duration label hangs `labelTailHeight` below the bottom of the
  // interval marker lines (flush with their bottom tail). The overflow bug was
  // never this offset — it was that `bodyHeight` overshot the visible list by a
  // full header height, dragging both the lines' tails and this label past the
  // panel edge. That's fixed in useTimeLineMeasurements (overflow body = list
  // height), so the original offset is correct again.
  const durationArrowYPos =
    size.bodyHeight + size.topOffsetRelative + labelTailHeight;

  return (
    <ThemeProvider theme={theme}>
      {/* Pointer handlers on the root (not the list): a float-mode interval
          must follow the cursor over the whole component, including the
          markers and duration arrow that render outside the list. */}
      <div
        ref={rootElRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          display: "flex",
          position: "relative",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <TimespaceClockSync
          targetElRef={rootElRef}
          size={size}
          homeDayPassedXPosRef={homeDayPassedXPosRef}
          viewStartUtcMs={viewStartUtcMs}
          todayStartUtcMs={todayStartUtcMs}
          viewOffsetSeconds={effectiveViewOffsetSeconds}
          positionKey={tzState.homeZone}
          onMinuteTick={() => {
            setColliderTrigger((c) => c + 1);
          }}
          onPositionReady={() => {
            // Force a collision/layout recompute after the first valid X position
            // is available (and after the delayed measurement pass).
            setIsNowXPosReady(true);
            setColliderTrigger((c) => c + 1);
            setTimeout(() => setColliderTrigger((c) => c + 1), 0);
          }}
        />
        <TimeLineRowClocksSync
          listElRef={listElRef}
          showSeconds={showSeconds}
        />
        <S.TimeLineList
          ref={listElRef}
          onDragOver={handleDragOverTimeLineList}
          onDrop={handleDropTimeLine}
          onPointerDown={handlePanPointerDown}
        >
          {timeLines.map((timeLine, index) => (
            <TimeLineRow
              key={timeLine.id}
              timeLine={timeLine}
              rowElRef={index === 0 ? firstTimelineElRef : null}
              headerElRef={index === 0 ? firstHeaderElRef : null}
              hoursElRef={index === 0 ? firstHoursElRef : null}
              size={size}
              colliderState={colliderState}
              isNowXPosReady={isNowXPosReady}
              viewStartUtcMs={viewStartUtcMs}
              isPanning={isPanning}
              showNowMarker={showNowMarker}
              nowMarkerGhost={isNowGhost}
              renderLineItems={renderLineItems}
              getLineHighlight={getLineHighlight}
              renderPlaceSelector={renderPlaceSelector}
              showTimezoneAbbreviation={showTimezoneAbbreviation}
              minimal={minimal}
              deltaBase={deltaBase}
              deltaBaseZone={deltaBaseZone}
              deltaToLocalByZone={deltaToLocalByZone}
              handleDragStartTimeLine={handleDragStartTimeLine}
              handleDragTimeLine={handleDragTimeLine}
              handleDragEndTimeLine={handleDragEndTimeLine}
              handleSetHomeZone={handleSetHomeZone}
              handleAddTimelinePlace={handleAddTimelinePlace}
              handleDeleteTimeline={handleDeleteTimeline}
              availabilityCells={availabilityGrid[timeLine.id]}
            />
          ))}
        </S.TimeLineList>

        <DurationArrow
          isSizeHolder
          id="duration-size-holder"
          startX={0}
          endX={1}
          yPos={durationArrowYPos}
          leftBoundary={size.leftOffset}
          rightBoundary={size.hoursLineWidth + size.leftOffset}
          headerHeight={size.timeLineItemHeaderHeight}
        />

        {timeIntervals
          .filter(({ xPos1, xPos2 }) => xPos1 !== null || xPos2 !== null)
          .map((timeInterval) => (
            <Fragment key={timeInterval.id}>
              {intervalPosKeys.map((posKey) => (
                <TimeIntervalMarker
                  key={posKey}
                  timeInterval={timeInterval}
                  posKey={posKey}
                  size={size}
                  faded={isPanning}
                  onAddCalendarEvent={
                    onAddCalendarEvent
                      ? () => onAddCalendarEvent(timeInterval)
                      : null
                  }
                  onDeleteTimePoint={handleDeleteTimePoint}
                  onResizeStart={(ev) => {
                    handleDragStartTimePoint(
                      ev,
                      timeInterval.id,
                      "resize",
                      getResizeTargetPosKey(timeInterval, posKey),
                    );
                  }}
                />
              ))}

              {timeInterval.xPos1 !== null &&
                timeInterval.xPos2 !== null &&
                timeInterval.durationPixels !== null &&
                // On a scrolled window an interval can straddle the strip's
                // wrap seam (its endpoints render in swapped pixel order);
                // the min/max arrow would then span the wrong region, so
                // only the hands render in that state.
                !(
                  timeInterval.xPos1DayOffsetSeconds != null &&
                  timeInterval.xPos2DayOffsetSeconds != null &&
                  timeInterval.xPos1DayOffsetSeconds <
                    timeInterval.xPos2DayOffsetSeconds !==
                    timeInterval.xPos1 < timeInterval.xPos2
                ) && (
                  <DurationArrow
                    id={timeInterval.id}
                    startX={
                      Math.min(timeInterval.xPos1, timeInterval.xPos2) -
                      size.leftListOffset
                    }
                    endX={
                      Math.max(timeInterval.xPos1, timeInterval.xPos2) -
                      size.leftListOffset
                    }
                    yPos={durationArrowYPos}
                    leftBoundary={size.leftOffset}
                    rightBoundary={size.hoursLineWidth + size.leftOffset}
                    color={theme.color.intervalHandBody}
                    durationText={timeInterval.durationHuman}
                    headerHeight={size.timeLineItemHeaderHeight}
                    faded={isPanning}
                    handleDragStart={(ev) => {
                      handleDragStartTimePoint(
                        ev,
                        timeInterval.id,
                        "move",
                        null,
                      );
                    }}
                  />
                )}
            </Fragment>
          ))}

        {/* clock hand of current time in a home zone  */}
        {/* Gate on isNowXPosReady: until TimespaceClockSync has measured the list
          and set --homeDayPassedXPos, `left` collapses to 0 and the hand would
          paint alone in the top-left corner before the timeline renders.
          The hand slides with the cells (the CSS var derives from the same
          viewStartUtcMs); when "now" is outside the scrolled window it turns
          into a dimmed ghost marking the current wall time on the viewed day. */}
        {showNowMarker && (
          <S.TimePoint
            style={{
              fontSize: `${theme.uiScale * 150}%`,
            }}
          >
            <div style={{ position: "absolute", top: 0, bottom: 0 }}>
              <VerticalMarker
                size={size}
                left="var(--homeDayPassedXPos)"
                className={
                  isNowGhost
                    ? "timeline-now-line timeline-now-line-ghost"
                    : "timeline-now-line"
                }
              />
            </div>
          </S.TimePoint>
        )}

        {/* Bottom-right corner, just below the row stack: the band above the
            rows is where interval hands park their clocks and calendar/delete
            controls, and the bottom-center band is where the duration label
            hangs — the right corner is the spot that stays clear of both.
            With an overflowing list (rowsBottomRelative = list height) the
            pill drops into the headroom below the component — the band
            consumers already reserve for the hand tails. */}
        {effectiveOffsetHours !== 0 && (
          <S.DayNav
            data-timespace-day-nav
            style={
              size.rowsBottomRelative != null
                ? { top: size.rowsBottomRelative + dayNavRowGap }
                : undefined
            }
          >
            <S.DayNavButton
              type="button"
              aria-label="Previous day start"
              onClick={() =>
                handleCommitViewOffsetHours(
                  getAdjacentDayStartOffsetHours(
                    tzState.homeZone,
                    nowDate,
                    viewOffsetHours,
                    -1,
                  ),
                )
              }
            >
              ‹
            </S.DayNavButton>
            <S.DayNavLabel data-timespace-day-label>
              {viewDayLabel}
              <span className="day-nav-offset">
                {formatHourOffsetLabel(effectiveOffsetHours)}
              </span>
            </S.DayNavLabel>
            <S.DayNavButton
              type="button"
              aria-label="Next day start"
              onClick={() =>
                handleCommitViewOffsetHours(
                  getAdjacentDayStartOffsetHours(
                    tzState.homeZone,
                    nowDate,
                    viewOffsetHours,
                    1,
                  ),
                )
              }
            >
              ›
            </S.DayNavButton>
            <S.DayNavButton
              type="button"
              onClick={() => handleCommitViewOffsetHours(0)}
            >
              Today
            </S.DayNavButton>
          </S.DayNav>
        )}

        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
          }}
        >
          <S.TimeLineHeader>
            <div ref={timeIntervalClockSampleElRef}>
              <S.Clock>00:00</S.Clock>
            </div>
          </S.TimeLineHeader>
        </div>
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
          }}
        >
          <S.TimeLineHeader>
            <div ref={timeZonesClockSampleElRef}>
              {/* Use a conservative (max-ish) sample so collisions don't underestimate width */}
              <S.Clock>{"00:00:00 PM"}</S.Clock>
            </div>
          </S.TimeLineHeader>
        </div>

        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
          }}
        >
          <img
            ref={transparentDragImageRef}
            alt="transparent drag icon"
            src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

Timespace.propTypes = {
  handleDeleteTimeline: PropTypes.func,
  handleAddTimelinePlace: PropTypes.func,
  onSetTimelinesOrder: PropTypes.func,
  measureElRef: PropTypes.object,
  renderLineItems: PropTypes.func,
  getLineHighlight: PropTypes.func,
  renderPlaceSelector: PropTypes.func,
  showTimezoneAbbreviation: PropTypes.bool,
  showSeconds: PropTypes.bool,
  minimal: PropTypes.bool,
  deltaBase: PropTypes.oneOf(["local", "home"]),
  formatDuration: PropTypes.func,
  onAddCalendarEvent: PropTypes.func,
  recomputeCollisionsKey: PropTypes.number,
  portalContainer: PropTypes.object,
  theme: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  themeMode: PropTypes.oneOf(["light", "dark"]),
};

export default Timespace;
