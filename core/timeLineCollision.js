import { addPercentShift, getBoundaryPositions } from "./timeLineMath";

function calculateOppositeSidePosition(
  clockBoundary,
  clockWidth,
  side,
  leftBoundary,
  rightBoundary,
) {
  if (side === "left") {
    const newStart = clockBoundary.start + clockWidth;
    const newEnd = clockBoundary.end + clockWidth;
    if (newEnd <= rightBoundary) {
      return {
        ...clockBoundary,
        side: "right",
        start: newStart,
        end: newEnd,
      };
    }
  } else {
    const newStart = clockBoundary.start - clockWidth;
    const newEnd = clockBoundary.end - clockWidth;
    if (newStart >= leftBoundary) {
      return {
        ...clockBoundary,
        side: "left",
        start: newStart,
        end: newEnd,
      };
    }
  }
  return clockBoundary;
}

export default function resolveTimeLineCollisions({
  timeInterval,
  timeZonesClock,
  timeLineName,
  size,
  homeDayPassedXPos,
  clockXTransformPercent,
}) {
  const leftBoundary = size.leftOffset + size.leftListOffset;
  const rightBoundary =
    size.hoursLineWidth + size.leftOffset + size.leftListOffset;
  const preferredSide = "right";

  const allCollidedItems = [
    (timeInterval?.xPos1 ?? null) !== null && {
      ...getBoundaryPositions(
        timeInterval.xPos1,
        addPercentShift(clockXTransformPercent, size.timeIntervalClockWidth),
        timeInterval.xPos1ClockSide === "left",
      ),
      pointName: "xPos1",
      side: timeInterval?.xPos1ClockSide,
      isTimeInterval: true,
      collisionIndexes: [],
      type: "timeInterval",
    },
    (timeInterval?.xPos2 ?? null) !== null && {
      ...getBoundaryPositions(
        timeInterval.xPos2,
        addPercentShift(clockXTransformPercent, size.timeIntervalClockWidth),
        timeInterval.xPos2ClockSide === "left",
      ),
      pointName: "xPos2",
      side: timeInterval.xPos2ClockSide,
      isTimeInterval: true,
      collisionIndexes: [],
      type: "timeInterval",
    },
    {
      ...getBoundaryPositions(
        // `homeDayPassedXPos` is in viewport coordinates already (see `TimespaceClockSync`)
        homeDayPassedXPos,
        addPercentShift(clockXTransformPercent, size.timeZonesClockWidth),
        timeZonesClock.side !== "right",
      ),
      side: timeZonesClock.side,
      isTimeInterval: false,
      collisionIndexes: [],
      type: "timeZonesClock",
    },
    {
      start:
        timeLineName.side === "left"
          ? size.leftOffset + size.leftListOffset
          : size.hoursLineWidth +
            size.leftOffset +
            size.leftListOffset -
            size.maxHeaderWidth,
      end:
        timeLineName.side === "left"
          ? size.maxHeaderWidth + size.leftOffset + size.leftListOffset
          : size.hoursLineWidth + size.leftOffset + size.leftListOffset,
      width: size.maxHeaderWidth,
      side: timeLineName.side,
      isTimeInterval: false,
      collisionIndexes: [],
      type: "timeLineName",
    },
  ]
    .filter(Boolean)
    .map((item) => {
      if (item?.type !== "timeLineName" && item.side !== preferredSide) {
        return calculateOppositeSidePosition(
          item,
          item.width,
          item.side,
          leftBoundary,
          rightBoundary,
        );
      }
      return item;
    });

  const detectCollisions = (clocksBoundary) => {
    const clockBoundaryMap = clocksBoundary.reduce((acc, item, index) => {
      acc[index] = item;
      return acc;
    }, {});

    clocksBoundary.forEach((_, index) => {
      const clockBoundary = clockBoundaryMap[index];

      // Check for right boundary collision
      if (clockBoundary.end > rightBoundary) {
        // Attempt to switch to left if possible
        clockBoundaryMap[index] = calculateOppositeSidePosition(
          clockBoundary,
          clockBoundary.width,
          "right",
          leftBoundary,
          rightBoundary,
        );
        return;
      }

      const collisionIndexes = clocksBoundary
        .map((_, otherIndex) => {
          const otherData = clockBoundaryMap[otherIndex];
          return [
            otherIndex !== index &&
              clockBoundary.end >= otherData.start &&
              clockBoundary.start <= otherData.end,
            otherIndex,
          ];
        })
        .filter((i) => {
          return i[0];
        })
        .map((i) => i[1]);

      let shouldApplyChanges = true;
      if (clockBoundary.type !== "timeLineName" && collisionIndexes.length) {
        const trySwitch = (collisionIndex) => {
          // Try switching side to avoid collision
          const switchedSideBoundary = calculateOppositeSidePosition(
            clockBoundary,
            clockBoundary.width,
            clockBoundary.side,
            leftBoundary,
            rightBoundary,
          );

          // Check if switching avoids both boundary and clock collisions
          const switchCausesCollision =
            clocksBoundary.some((_, otherIndex) => {
              const otherData = clockBoundaryMap[otherIndex];
              return (
                otherIndex !== index &&
                switchedSideBoundary.end > otherData.start &&
                switchedSideBoundary.start < otherData.end
              );
            }) ||
            switchedSideBoundary.start <= leftBoundary ||
            switchedSideBoundary.end >= rightBoundary;

          if (!switchCausesCollision) {
            clockBoundaryMap[index] = {
              ...switchedSideBoundary,
              collisionIndexes: (
                clockBoundaryMap[index]?.collisionIndexes ?? []
              ).filter((i) => i !== collisionIndex),
            };
            clockBoundaryMap[collisionIndex] = {
              ...clockBoundaryMap[collisionIndex],
              collisionIndexes: (
                clockBoundaryMap[collisionIndex]?.collisionIndexes ?? []
              ).filter((i) => i !== index),
            };
            shouldApplyChanges = false;
          }
        };
        collisionIndexes.forEach(trySwitch);
      }

      if (shouldApplyChanges) {
        clockBoundaryMap[index] = {
          ...clockBoundary,
          collisionIndexes,
        };
      }
    });

    return clocksBoundary.map((item, index) => {
      const clockBoundary = clockBoundaryMap[index];
      return clockBoundary;
    });
  };

  return detectCollisions(allCollidedItems);
}
