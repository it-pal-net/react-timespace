import {
  Fragment,
  useCallback,
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
import useTimeIntervalDrag from "./hooks/useTimeIntervalDrag";
import useTimeLineCollisionResolution from "./hooks/useTimeLineCollisionResolution";
import useTimeLineAutoCollision from "./hooks/useTimeLineAutoCollision";
import TimespaceClockSync from "./TimespaceClockSync";
import TimeLineRowClocksSync from "./TimeLineRowClocksSync";
import resolveTimeLineCollisions from "./core/timeLineCollision";
import {
  calculateDurationData,
  formatDeltaToLocal,
  getTimeZoneOffsetSecondsSafe,
  getXPosFromDayOffset,
  getSecondsFromStartOfDay,
  SECONDS_IN_DAY,
} from "./core/timeLineMath";
import {
  labelTailHeight,
  clockXTransformPercent,
  zIndexFloors,
  backdropFilter,
  intervalPosKeys,
} from "./constants";
import { withThemeDefaults } from "./theme";

const defaultColliderState = {
  side: "right",
  isCollided: null,
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
  deltaBase = "home",
  formatDuration,
  onAddCalendarEvent,
  recomputeCollisionsKey = 0,
  portalContainer,
}) => {
  const rootElRef = useRef(null);
  const outerTheme = useTheme();
  const theme = useMemo(() => withThemeDefaults(outerTheme), [outerTheme]);
  const { tzState, tzDispatch, timeLines, timeIntervals } =
    useContext(TimeZonesContext);
  const clockCtx = useTimeZonesClock();
  const timeZonesClock = clockCtx?.timeZonesClock ?? {};

  const [showTimezoneAbbreviationStored] = useLocalStorage(
    "showTimezoneAbbreviation",
    false,
  );
  const showTimezoneAbbreviation =
    typeof showTimezoneAbbreviationProp === "boolean"
      ? showTimezoneAbbreviationProp
      : showTimezoneAbbreviationStored;
  const [showSeconds] = useLocalStorage("showSeconds", false);
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
    timeIntervalXPos1: defaultColliderState,
    timeIntervalXPos2: defaultColliderState,
  });

  const homeDayPassedXPosRef = useRef(0);

  const calculatePositionFromDayOffset = useCallback(
    (secondsOffsetFromDay) => getXPosFromDayOffset(secondsOffsetFromDay, size),
    [size],
  );

  const calculateSecondsFromStartOfDay = useCallback(
    (xPos) => getSecondsFromStartOfDay(xPos, size),
    [size],
  );

  const collider = useCallback(
    ({ timeInterval, timeZonesClock, timeLineName }) =>
      resolveTimeLineCollisions({
        timeInterval,
        timeZonesClock,
        timeLineName,
        size,
        homeDayPassedXPos: homeDayPassedXPosRef.current,
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
    homeDayPassedXPos: homeDayPassedXPosRef.current,
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

  const { handleMouseMove, handleMouseUp, handleDragStartTimePoint } =
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
  };

  return (
    <ThemeProvider theme={theme}>
      <div
        ref={rootElRef}
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
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDragOver={handleDragOverTimeLineList}
          onDrop={handleDropTimeLine}
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
              renderLineItems={renderLineItems}
              getLineHighlight={getLineHighlight}
              renderPlaceSelector={renderPlaceSelector}
              showTimezoneAbbreviation={showTimezoneAbbreviation}
              deltaBase={deltaBase}
              deltaBaseZone={deltaBaseZone}
              deltaToLocalByZone={deltaToLocalByZone}
              handleDragStartTimeLine={handleDragStartTimeLine}
              handleDragTimeLine={handleDragTimeLine}
              handleDragEndTimeLine={handleDragEndTimeLine}
              handleDragStartTimePoint={handleDragStartTimePoint}
              handleSetHomeZone={handleSetHomeZone}
              handleAddTimelinePlace={handleAddTimelinePlace}
              handleDeleteTimeline={handleDeleteTimeline}
            />
          ))}
        </S.TimeLineList>

        <DurationArrow
          isSizeHolder
          id="duration-size-holder"
          startX={0}
          endX={1}
          yPos={size.bodyHeight + size.topOffsetRelative + labelTailHeight}
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
                  onAddCalendarEvent={
                    onAddCalendarEvent
                      ? () => onAddCalendarEvent(timeInterval)
                      : null
                  }
                  onDeleteTimePoint={handleDeleteTimePoint}
                />
              ))}

              {timeInterval.xPos1 !== null &&
                timeInterval.xPos2 !== null &&
                timeInterval.durationPixels !== null && (
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
                    yPos={
                      size.bodyHeight + size.topOffsetRelative + labelTailHeight
                    }
                    leftBoundary={size.leftOffset}
                    rightBoundary={size.hoursLineWidth + size.leftOffset}
                    color={theme.color.intervalHandBody}
                    durationText={timeInterval.durationHuman}
                    headerHeight={size.timeLineItemHeaderHeight}
                    handleDragStart={(ev) => {
                      handleDragStartTimePoint(
                        ev,
                        timeInterval.id,
                        "move",
                        null,
                      );
                    }}
                    handleMouseMove={handleMouseMove}
                    handleMouseUp={handleMouseUp}
                  />
                )}
            </Fragment>
          ))}

        {/* clock hand of current time in a home zone  */}
        {/* Gate on isNowXPosReady: until TimespaceClockSync has measured the list
          and set --homeDayPassedXPos, `left` collapses to 0 and the hand would
          paint alone in the top-left corner before the timeline renders. */}
        {isNowXPosReady && (
          <S.TimePoint
            style={{
              fontSize: `${theme.uiScale * 150}%`,
            }}
          >
            <div style={{ position: "absolute", top: 0, bottom: 0 }}>
              <VerticalMarker
                size={size}
                left="var(--homeDayPassedXPos)"
                className="timeline-now-line"
              />
            </div>
          </S.TimePoint>
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
  deltaBase: PropTypes.oneOf(["local", "home"]),
  formatDuration: PropTypes.func,
  onAddCalendarEvent: PropTypes.func,
  recomputeCollisionsKey: PropTypes.number,
  portalContainer: PropTypes.object,
};

export default Timespace;
