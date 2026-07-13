import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";

import Button from "./ui/Button";
import { CrossIcon, AddCalendarEventIcon } from "./ui/icons";
import * as S from "./styled";
import { labelTailHeight, zIndexFloors } from "./constants";

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
};

const TimeIntervalMarker = ({
  timeInterval,
  posKey,
  size,
  onAddCalendarEvent,
  onDeleteTimePoint,
}) => {
  const theme = useTheme();

  if (timeInterval[posKey] === null) {
    return null;
  }

  return (
    <S.TimePoint
      style={{
        fontSize: `${theme.uiScale * 150}%`,
        pointerEvents: timeInterval.mode === "fixed" ? "auto" : "none",
      }}
    >
      <VerticalMarker
        size={size}
        left={timeInterval[posKey] - size.leftListOffset}
        backgroundColor={theme.color.intervalHandBody}
        cursor={
          ["fixed", "resize"].includes(timeInterval.mode) ? "e-resize" : "auto"
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
  onAddCalendarEvent: PropTypes.func,
  onDeleteTimePoint: PropTypes.func.isRequired,
};

export default TimeIntervalMarker;
