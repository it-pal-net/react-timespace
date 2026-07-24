import { Fragment, useContext } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { House, MapPin } from "lucide-react";

import { TimeZonesContext, useTimeZonesClock } from "./state/timeZonesProvider";
import { deleteTimeline, updateTimeline } from "./state/actions";

import Button from "./ui/Button";
import { CrossIcon, UserIcon } from "./ui/icons";
import TimeZoneSelect from "./ui/TimeZoneSelect";
import TimeLine from "./TimeLine";
import Clock from "./Clock";
import * as S from "./styled";
import {
  zIndexFloors,
  backdropFilter,
  clockXTransformPercent,
  intervalPosKeys,
} from "./constants";

const HOUR_MAX_WIDTH = 100;
const transition = "top 0.2s ease, transform 0.2s ease";

const StaticNowClockLabel = ({ timeZone, color }) => {
  return (
    <S.Clock color={color} data-timeline-now-clock data-timezone={timeZone} />
  );
};
StaticNowClockLabel.propTypes = {
  timeZone: PropTypes.string.isRequired,
  color: PropTypes.string,
};

const StaticTimeZoneAbbrev = ({ timeZone }) => {
  return <span data-timeline-tz-abbrev data-timezone={timeZone} />;
};
StaticTimeZoneAbbrev.propTypes = {
  timeZone: PropTypes.string.isRequired,
};

const TimeLineRow = ({
  timeLine,
  rowElRef,
  headerElRef,
  hoursElRef,
  size,
  colliderState,
  isNowXPosReady,
  showTimezoneAbbreviation,
  minimal,
  deltaBase,
  deltaBaseZone,
  deltaToLocalByZone,
  handleDragStartTimeLine,
  handleDragTimeLine,
  handleDragEndTimeLine,
  handleSetHomeZone,
  handleAddTimelinePlace,
  handleDeleteTimeline,
  renderLineItems,
  getLineHighlight,
  renderPlaceSelector,
}) => {
  const theme = useTheme();
  const { tzState, tzDispatch, timeIntervals } = useContext(TimeZonesContext);
  const clockCtx = useTimeZonesClock();

  const paddingTop = size.timeLineItemHeaderHeight / 2;

  const highlight = getLineHighlight?.(timeLine) ?? null;

  const contactsInLine = renderLineItems?.(timeLine) ?? null;

  const handlePlaceSelected = (option) => {
    if (handleAddTimelinePlace) {
      handleAddTimelinePlace(timeLine, option);
    } else {
      tzDispatch(
        updateTimeline({
          id: timeLine.id,
          name: option.label,
          timeZone: option.place?.timeZone ?? option.timeZone,
          mode: null,
        }),
      );
    }
  };

  const handlePlaceSelectorBlur = () => {
    if (timeLine.id.startsWith("temp-")) {
      tzDispatch(deleteTimeline(timeLine.id));
    }
  };

  return (
    <S.TimeLineItem
      ref={rowElRef}
      className="time-line-item"
      data-timeline-id={timeLine.id}
      style={{
        ...(highlight === "dim" && {
          opacity: 0.42,
        }),
        ...(highlight === "focus" && {
          backgroundColor:
            theme.mode === "dark"
              ? "rgba(120, 200, 255, 0.06)"
              : "rgba(56, 136, 255, 0.06)",
          boxShadow: "inset 0 0 0 1px rgba(120, 200, 255, 0.25)",
          borderRadius: "8px",
        }),
        zIndex: zIndexFloors.base,
        position: "relative",
        ...(timeLine.isLocked && {
          position: "sticky",
          zIndex: zIndexFloors.lockedRow,
          top: 0,
          bottom: 0,
        }),
        ...(timeLine.mode === "edit"
          ? {
              zIndex: zIndexFloors.head,
            }
          : {}),
        paddingTop,
      }}
    >
      <div
        className="timeline-drag-handle"
        draggable={!timeLine.isLocked}
        onDragStart={(e) => handleDragStartTimeLine(e, timeLine)}
        onDrag={(e) => handleDragTimeLine(e)}
        onDragEnd={handleDragEndTimeLine}
      />
      {tzState.homeZone === timeLine.timeZone && (
        <div
          style={{
            zIndex: -1,
            position: "absolute",
            top: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}

      <S.TimeLineHeader ref={headerElRef}>
        <S.TimeLineHeaderContent>
          <div
            style={{
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                whiteSpace: "nowrap",
                left: "var(--homeDayPassedXPos)",
                transition,
                opacity: isNowXPosReady ? 1 : 0,
                transform: [
                  "translateX(",
                  colliderState.timeZonesClock.side === "left"
                    ? -(100 + clockXTransformPercent)
                    : clockXTransformPercent,
                  "%",
                  ")",
                ].join(""),
                top: colliderState.timeZonesClock.top,
                fontSize: colliderState.timeZonesClock.fontSize,
                zIndex: colliderState.timeZonesClock.zIndex,
                backdropFilter: isNowXPosReady ? backdropFilter : "none",
                WebkitBackdropFilter: isNowXPosReady ? backdropFilter : "none",
              }}
            >
              <StaticNowClockLabel
                color={timeLine.color}
                timeZone={timeLine.timeZone}
              />
            </div>

            {timeIntervals.map((timeInterval) => (
              <Fragment key={timeInterval.id}>
                {intervalPosKeys.map((posKey) => {
                  if (timeInterval[posKey] === null) {
                    return null;
                  }
                  const clockCollider =
                    posKey === "xPos1"
                      ? colliderState.timeIntervalXPos1
                      : colliderState.timeIntervalXPos2;
                  return (
                    <div
                      key={posKey}
                      style={{
                        position: "absolute",
                        left: timeInterval[posKey] - size.leftListOffset,
                        transition,
                        transform: `translateX(${
                          timeInterval[`${posKey}ClockSide`] === "left"
                            ? -(100 + clockXTransformPercent)
                            : clockXTransformPercent
                        }%)`,
                        top: clockCollider.top,
                        fontSize: clockCollider.fontSize,
                        zIndex: clockCollider.zIndex,
                        backdropFilter,
                        WebkitBackdropFilter: backdropFilter,
                      }}
                    >
                      <Clock
                        color={timeInterval.color}
                        timeZone={timeLine.timeZone}
                        dayOffsetSeconds={
                          timeInterval[`${posKey}DayOffsetSeconds`]
                        }
                      />
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>

          <div
            style={{
              position: "relative",
              left:
                colliderState.timeLineName.side === "left"
                  ? size.leftOffset
                  : size.hoursLineWidth + size.leftOffset - size.maxHeaderWidth,
            }}
          >
            <div
              className="time-line-header-content"
              style={{
                display: "flex",
              }}
            >
              <div
                style={{
                  width: 0,
                  opacity: 0,
                }}
              >
                _Size_Holder_
              </div>
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  height: "fit-content",
                  top: colliderState.timeLineName.top,
                  // Shrink via `transform` (not `fontSize`) so the measured
                  // `.time-line-header-content` width stays at natural size — otherwise a
                  // collision-shrunk font feeds a smaller width back into the collision
                  // decision and the labels oscillate/overlap. See `useTimeLineMeasurements`.
                  transform:
                    colliderState.timeLineName.scale === 1
                      ? undefined
                      : `scale(${colliderState.timeLineName.scale})`,
                  transformOrigin: `${colliderState.timeLineName.side} top`,
                  backdropFilter,
                  WebkitBackdropFilter: backdropFilter,
                  gap: "4px",
                }}
              >
                {colliderState.timeLineName.side === "right" && contactsInLine}
                <S.TimeLineName
                  style={{
                    ...(timeLine.color ? { color: timeLine.color } : {}),
                  }}
                  onClick={() => {
                    if (timeLine.mode !== "edit") {
                      handleSetHomeZone(timeLine.timeZone);
                    }
                  }}
                >
                  {timeLine.mode === "edit" ? (
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        minWidth: "300px",
                      }}
                    >
                      {renderPlaceSelector ? (
                        renderPlaceSelector({
                          timeLine,
                          height: `${size.timeLineItemHeaderHeight}px`,
                          onSelect: handlePlaceSelected,
                          onBlur: handlePlaceSelectorBlur,
                        })
                      ) : (
                        <TimeZoneSelect
                          height={`${size.timeLineItemHeaderHeight}px`}
                          onSelect={handlePlaceSelected}
                          onBlur={handlePlaceSelectorBlur}
                        />
                      )}
                    </div>
                  ) : (
                    timeLine.name
                  )}
                  {!minimal &&
                    timeLine.mode !== "edit" &&
                    timeLine.timeZone !== deltaBaseZone &&
                    timeLine.timeZone !== tzState.homeZone &&
                    deltaToLocalByZone[timeLine.timeZone] && (
                      <span
                        style={{
                          marginLeft: "6px",
                          opacity: 0.7,
                        }}
                        title={`Difference to ${deltaBase === "home" ? "home" : "you"} (${deltaBaseZone})`}
                        data-timeline-delta
                        data-timezone={timeLine.timeZone}
                      >
                        {" • "}
                        {deltaToLocalByZone[timeLine.timeZone]}
                      </span>
                    )}
                  {tzState.homeZone === timeLine.timeZone &&
                    timeLine.name !== null && (
                      <span
                        className="home-emoji"
                        title="Home timezone"
                        aria-label="Home timezone"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "8px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "999px",
                          color: "var(--text-on-accent, #fff)",
                          background: "var(--accent, #3b82f6)",
                          verticalAlign: "middle",
                        }}
                      >
                        <House size={13} strokeWidth={2.5} />
                      </span>
                    )}
                </S.TimeLineName>
                {!minimal && timeLine.mode !== "edit" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.72rem",
                      color: "var(--text-subtle)",
                      padding: "1px 6px",
                      borderRadius: "999px",
                      background: "rgba(255, 255, 255, 0.06)",
                      whiteSpace: "nowrap",
                    }}
                    title="Contacts represented in this time zone"
                  >
                    {Object.keys(timeLine.contacts ?? {}).length === 0 ? (
                      <MapPin size={12} />
                    ) : (
                      <>
                        <UserIcon size="small" applyUiScale={false} />
                        {Object.keys(timeLine.contacts ?? {}).length}
                      </>
                    )}
                  </span>
                )}

                {!minimal && timeLine.allowDelete && (
                  <S.EditModeActions
                    isCollided={colliderState.timeLineName.isCollided}
                  >
                    <Button
                      appearance="subtle-link"
                      spacing="none"
                      withIcon
                      style={{
                        color: "var(--timeline-text, var(--text))",
                        ...(timeLine.color ? { color: timeLine.color } : {}),
                      }}
                      onClick={() => {
                        if (handleDeleteTimeline) {
                          handleDeleteTimeline(timeLine);
                        }
                      }}
                    >
                      <CrossIcon
                        size={
                          colliderState.timeLineName.isCollided
                            ? "small"
                            : "middle"
                        }
                      />
                    </Button>
                  </S.EditModeActions>
                )}
                {colliderState.timeLineName.side === "left" && contactsInLine}
                {!minimal &&
                  showTimezoneAbbreviation &&
                  timeLine.mode !== "edit" &&
                  timeLine.timeZone !== "Etc/UTC" && (
                    <div
                      style={{
                        marginLeft: "2px",
                        color: "var(--timeline-text, var(--text))",
                      }}
                    >
                      {" • "}
                      <StaticTimeZoneAbbrev timeZone={timeLine.timeZone} />
                    </div>
                  )}
              </div>
            </div>
          </div>
        </S.TimeLineHeaderContent>
      </S.TimeLineHeader>
      <TimeLine
        hoursElRef={hoursElRef}
        timeZone={timeLine.timeZone}
        color={timeLine.color}
        homeZone={tzState.homeZone}
        hourMaxWidth={HOUR_MAX_WIDTH}
        timer={clockCtx?.timer}
      />
      {/* Crisp within-row segments of the interval hands. The full-height
          marker line (rendered at the Timespace level) sits at basement
          z-index, behind the rows' frosted-glass background, so without these
          the hands look blurred/dimmed across the hour cells. Same pattern as
          the now-line segment below. */}
      {timeIntervals.map((timeInterval) => (
        <Fragment key={timeInterval.id}>
          {intervalPosKeys.map(
            (posKey) =>
              timeInterval[posKey] !== null && (
                <S.TimePointBody
                  key={posKey}
                  style={{
                    position: "absolute",
                    height: "100%",
                    top: 0,
                    left: timeInterval[posKey] - size.leftListOffset,
                    backgroundColor: theme.color.intervalHandBody,
                    pointerEvents: "none",
                  }}
                />
              ),
          )}
        </Fragment>
      ))}
      <S.TimePointBody
        className="timeline-now-line"
        style={{
          position: "absolute",
          height: "100%",
          top: 0,
          left: "var(--homeDayPassedXPos)",
          pointerEvents: "none",
        }}
      />
    </S.TimeLineItem>
  );
};

TimeLineRow.propTypes = {
  timeLine: PropTypes.object.isRequired,
  rowElRef: PropTypes.object,
  headerElRef: PropTypes.object,
  hoursElRef: PropTypes.object,
  size: PropTypes.object.isRequired,
  colliderState: PropTypes.object.isRequired,
  isNowXPosReady: PropTypes.bool,
  showTimezoneAbbreviation: PropTypes.bool,
  minimal: PropTypes.bool,
  deltaBase: PropTypes.oneOf(["local", "home"]),
  deltaBaseZone: PropTypes.string,
  deltaToLocalByZone: PropTypes.object.isRequired,
  handleDragStartTimeLine: PropTypes.func.isRequired,
  handleDragTimeLine: PropTypes.func.isRequired,
  handleDragEndTimeLine: PropTypes.func.isRequired,
  handleSetHomeZone: PropTypes.func.isRequired,
  handleAddTimelinePlace: PropTypes.func,
  handleDeleteTimeline: PropTypes.func,
  renderLineItems: PropTypes.func,
  getLineHighlight: PropTypes.func,
  renderPlaceSelector: PropTypes.func,
};

export default TimeLineRow;
