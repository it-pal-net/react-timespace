import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";

import Button from "./ui/Button";
import { CrossIcon, AddCalendarEventIcon } from "./ui/icons";
import * as S from "./styled";
import {
  labelTailHeight,
  intervalHitStripWidth,
  zIndexFloors,
} from "./constants";

/**
 * Full-height vertical line with rounded tails above and below the timeline
 * body. Used for both time-interval hands and the "now" hand (which passes a
 * CSS-var `left` and no background so styled defaults apply).
 */
export const VerticalMarker = ({
  size,
  left,
  className,
  backgroundColor,
  cursor,
  topTailChildren,
  pieceStyle,
}) => (
  <>
    <S.TimePointTail
      className={className}
      style={{
        position: "absolute",
        height: labelTailHeight,
        top: size.topOffsetRelative - labelTailHeight,
        left,
        zIndex: zIndexFloors.markerTail,
        borderTopRightRadius: "90%",
        borderTopLeftRadius: "90%",
        backgroundColor,
        ...pieceStyle,
      }}
    >
      {topTailChildren}
    </S.TimePointTail>
    <S.TimePointBody
      className={className}
      style={{
        position: "absolute",
        height: size.bodyHeight,
        top: size.topOffsetRelative,
        left,
        zIndex: zIndexFloors.basement,
        cursor,
        backgroundColor,
        ...pieceStyle,
      }}
    />
    <S.TimePointTail
      className={className}
      style={{
        position: "absolute",
        height: labelTailHeight,
        top: size.bodyHeight + size.topOffsetRelative,
        left,
        zIndex: zIndexFloors.markerTail,
        borderBottomRightRadius: "90%",
        borderBottomLeftRadius: "90%",
        backgroundColor,
        ...pieceStyle,
      }}
    />
  </>
);

VerticalMarker.propTypes = {
  size: PropTypes.object.isRequired,
  left: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  className: PropTypes.string,
  backgroundColor: PropTypes.string,
  cursor: PropTypes.string,
  topTailChildren: PropTypes.node,
  // Merged into each piece separately (never a wrapper) so a fade doesn't
  // create a group stacking context and break the basement/base z-interleave
  // of the hand body behind the rows' frosted glass.
  pieceStyle: PropTypes.object,
};

const TimeIntervalMarker = ({
  timeInterval,
  posKey,
  size,
  faded,
  onAddCalendarEvent,
  onDeleteTimePoint,
  onResizeStart,
}) => {
  const theme = useTheme();

  if (timeInterval[posKey] === null) {
    return null;
  }

  const left = timeInterval[posKey] - size.leftListOffset;
  const lineWidth = theme.uiScale * theme.size.clockHand;
  const fadeStyle = {
    opacity: faded ? 0 : 1,
    transition: "opacity 0.18s ease",
  };

  return (
    <S.TimePoint
      style={{
        fontSize: `${theme.uiScale * 150}%`,
        pointerEvents:
          !faded && timeInterval.mode === "fixed" ? "auto" : "none",
      }}
    >
      {/* The grab surface: a wide invisible strip centered on the hand, so the
          whole visible line is draggable, not just a 3px sliver. Rendered
          before the marker pieces so `~` sibling styles can light them up. */}
      <S.IntervalHitStrip
        data-interval-hit-strip={posKey}
        style={{
          top: size.topOffsetRelative - labelTailHeight,
          height: size.bodyHeight + labelTailHeight * 2,
          left: left - (intervalHitStripWidth - lineWidth) / 2,
          width: intervalHitStripWidth,
          ...fadeStyle,
        }}
        onPointerDown={onResizeStart}
      />
      <VerticalMarker
        size={size}
        left={left}
        className="interval-marker-piece"
        pieceStyle={fadeStyle}
        backgroundColor={theme.color.intervalHandBody}
        cursor={
          ["fixed", "resize"].includes(timeInterval.mode) ? "ew-resize" : "auto"
        }
        topTailChildren={
          timeInterval.mode !== "float" && (
            <div style={{ minWidth: "100px" }}>
              {posKey === "xPos1" && onAddCalendarEvent && (
                <Button
                  withIcon
                  style={{
                    transform: "translate(-120%)",
                    position: "sticky",
                  }}
                  onClick={onAddCalendarEvent}
                >
                  <AddCalendarEventIcon applyUiScale size="small" />
                </Button>
              )}
              <Button
                withIcon
                style={{
                  transform:
                    posKey === "xPos1"
                      ? "translate(30%, -100%)"
                      : "translate(30%)",
                  position: "sticky",
                }}
                onClick={() => {
                  onDeleteTimePoint(timeInterval, posKey);
                }}
              >
                <CrossIcon
                  applyUiScale
                  size="small"
                  style={
                    posKey === "xPos2"
                      ? { color: "var(--timeline-text, var(--text))" }
                      : undefined
                  }
                />
              </Button>
            </div>
          )
        }
      />
    </S.TimePoint>
  );
};

TimeIntervalMarker.propTypes = {
  timeInterval: PropTypes.object.isRequired,
  posKey: PropTypes.oneOf(["xPos1", "xPos2"]).isRequired,
  size: PropTypes.object.isRequired,
  // Fades the marker out (and disables interaction) while the day window is
  // being panned; positions stay anchored to the committed day page.
  faded: PropTypes.bool,
  onAddCalendarEvent: PropTypes.func,
  onDeleteTimePoint: PropTypes.func.isRequired,
  onResizeStart: PropTypes.func.isRequired,
};

export default TimeIntervalMarker;
