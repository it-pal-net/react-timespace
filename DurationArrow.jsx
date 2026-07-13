import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";

const DurationArrow = ({
  isSizeHolder = false,
  id,
  startX,
  endX,
  yPos,
  color,
  leftBoundary,
  rightBoundary,
  durationText,
  headerHeight,
  handleDragStart,
  handleMouseMove,
  handleMouseUp,
}) => {
  const theme = useTheme();

  const durationTextElRef = useRef(null);
  const [textWidth, setTextWidth] = useState(200);
  const durationPixels = Math.abs(endX - startX);
  const clockHandSize = theme.size.clockHand * theme.uiScale;

  const arrowPadding = 4;
  const rangeArrowHeight = 4;
  const rangeArrowWidth = 8;
  const arrowPoints = `0 0, ${rangeArrowWidth} ${rangeArrowHeight / 2}, 0 ${rangeArrowHeight}`;
  const rangeBothArrowsWidth = rangeArrowWidth * 2;

  useEffect(() => {
    setTimeout(() => {
      if (durationTextElRef.current) {
        setTextWidth(durationTextElRef.current.getBBox().width + 4);
      }
    }, 200);
  }, [theme.uiScale]);

  const textX = useMemo(() => {
    let calculatedTextX = Math.abs((endX - startX) / 2);
    const halfTextWidth = textWidth / 2;

    if (endX - textWidth < leftBoundary) {
      calculatedTextX = leftBoundary - startX + halfTextWidth + rangeArrowWidth;
    }
    if (startX + textWidth > rightBoundary) {
      calculatedTextX =
        rightBoundary - startX - halfTextWidth - rangeArrowWidth;
    }
    return calculatedTextX;
  }, [startX, endX, leftBoundary, rightBoundary, rangeArrowWidth, textWidth]);

  const showArrow = useMemo(() => {
    const extraSpace = 20;
    let lineWidth =
      durationPixels -
      rangeBothArrowsWidth -
      clockHandSize * 2 -
      arrowPadding * 2 -
      extraSpace;
    const arrowVisible = lineWidth > 0;
    if (!arrowVisible) {
      lineWidth = durationPixels;
    }
    return arrowVisible;
  }, [durationPixels, rangeBothArrowsWidth]);

  const svgWidth = durationPixels;
  // const svgHeight = headerHeight;
  const svgHeight = rangeArrowHeight * 2;
  const markerStartUrl = `url(#arrowhead-start-${id})`;
  const markerEndUrl = `url(#arrowhead-end-${id})`;
  const fontSize = `${theme.uiScale * 150}%`;

  const maxYPos = window.innerHeight - rangeArrowHeight * 2 - clockHandSize * 2;

  if (isSizeHolder) {
    return (
      <svg
        style={{
          position: "absolute",
          opacity: 0,
          top: yPos > maxYPos ? maxYPos : yPos,
          left: startX,
        }}
        width={1}
        height={svgHeight}
      />
    );
  }

  return (
    <svg
      style={{
        position: "absolute",
        top: yPos > maxYPos ? maxYPos : yPos,
        left: startX,
        overflow: "visible",
      }}
      width={svgWidth}
      height={svgHeight}
    >
      {showArrow && (
        <defs>
          <marker
            id={`arrowhead-start-${id}`}
            markerWidth={rangeArrowWidth}
            markerHeight={rangeArrowHeight}
            refX={rangeArrowWidth - arrowPadding / 2}
            refY={rangeArrowHeight / 2}
            orient="auto-start-reverse"
          >
            <polygon points={arrowPoints} fill={color} />
          </marker>
          <marker
            id={`arrowhead-end-${id}`}
            markerWidth={rangeArrowWidth}
            markerHeight={rangeArrowHeight}
            refX={rangeArrowWidth - arrowPadding / 2}
            refY={rangeArrowHeight / 2}
            orient="auto"
          >
            <polygon points={arrowPoints} fill={color} />
          </marker>
        </defs>
      )}
      <line
        x1={clockHandSize + rangeArrowWidth}
        y1="0"
        x2={durationPixels - rangeArrowWidth}
        y2="0"
        stroke={color}
        strokeWidth={clockHandSize}
        markerStart={markerStartUrl}
        markerEnd={markerEndUrl}
      />
      <text
        ref={durationTextElRef}
        x={textX}
        fill={color}
        textAnchor="middle"
        onMouseUp={handleMouseUp}
        onMouseDown={handleDragStart}
        onMouseMove={handleMouseMove}
        style={{
          fontSize,
          cursor: "e-resize",
          transform: `translateY(-${headerHeight / 2}px)`,
          userSelect: "none",
          // pointerEvents: "none",
        }}
        draggable
      >
        {durationText}
      </text>
    </svg>
  );
};

DurationArrow.propTypes = {
  isSizeHolder: PropTypes.bool,
  id: PropTypes.string,
  startX: PropTypes.number,
  endX: PropTypes.number,
  yPos: PropTypes.number,
  color: PropTypes.string,
  leftBoundary: PropTypes.number,
  rightBoundary: PropTypes.number,
  durationText: PropTypes.string,
  headerHeight: PropTypes.number,
  handleDragStart: PropTypes.func,
  handleMouseMove: PropTypes.func,
  handleMouseUp: PropTypes.func,
};

export default DurationArrow;
