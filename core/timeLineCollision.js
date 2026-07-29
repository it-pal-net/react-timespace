import { addPercentShift, getBoundaryPositions } from "./timeLineMath";

const boundariesOverlap = (first, second) =>
  first.end > second.start && first.start < second.end;

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

function addStackLayout(clocksBoundary) {
  const collisionIndexesByIndex = clocksBoundary.map((clockBoundary, index) =>
    clocksBoundary
      .map((otherBoundary, otherIndex) =>
        otherIndex !== index &&
        boundariesOverlap(clockBoundary, otherBoundary)
          ? otherIndex
          : null,
      )
      .filter((otherIndex) => otherIndex !== null),
  );

  // Horizontal label bounds form an interval graph. Assigning lanes in
  // start-position order gives every overlapping pair a different vertical
  // lane while reusing lanes as soon as labels no longer overlap.
  const sortedIndexes = clocksBoundary
    .map((_, index) => index)
    .sort(
      (firstIndex, secondIndex) =>
        clocksBoundary[firstIndex].start -
          clocksBoundary[secondIndex].start ||
        clocksBoundary[firstIndex].end - clocksBoundary[secondIndex].end ||
        firstIndex - secondIndex,
    );
  const laneEnds = [];
  const stackIndexes = [];

  sortedIndexes.forEach((index) => {
    const clockBoundary = clocksBoundary[index];
    let stackIndex = laneEnds.findIndex(
      (laneEnd) => laneEnd <= clockBoundary.start,
    );
    if (stackIndex === -1) {
      stackIndex = laneEnds.length;
    }
    laneEnds[stackIndex] = clockBoundary.end;
    stackIndexes[index] = stackIndex;
  });

  // A chain such as A↔B↔C should use one stable font size/layout even when A
  // and C do not overlap directly, so calculate stack size per connected
  // horizontal group.
  const stackSizes = Array(clocksBoundary.length).fill(1);
  let componentIndexes = [];
  let componentEnd = -Infinity;
  const finishComponent = () => {
    if (!componentIndexes.length) {
      return;
    }
    const stackSize =
      Math.max(...componentIndexes.map((index) => stackIndexes[index])) + 1;
    componentIndexes.forEach((index) => {
      stackSizes[index] = stackSize;
    });
  };

  sortedIndexes.forEach((index) => {
    const clockBoundary = clocksBoundary[index];
    if (componentIndexes.length && clockBoundary.start >= componentEnd) {
      finishComponent();
      componentIndexes = [];
      componentEnd = -Infinity;
    }
    componentIndexes.push(index);
    componentEnd = Math.max(componentEnd, clockBoundary.end);
  });
  finishComponent();

  return clocksBoundary.map((clockBoundary, index) => ({
    ...clockBoundary,
    collisionIndexes: collisionIndexesByIndex[index],
    stackIndex: stackIndexes[index],
    stackSize: stackSizes[index],
  }));
}

export default function resolveTimeLineCollisions({
  timeIntervals,
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
  const timeLineNameSide = timeLineName?.side ?? "left";
  // Keep accepting the original singular input for internal callers and
  // source consumers while the component moves to collective resolution.
  const intervals =
    timeIntervals ?? ((timeInterval?.id ?? null) !== null ? [timeInterval] : []);

  const allCollidedItems = [
    ...intervals.flatMap((interval, intervalIndex) =>
      ["xPos1", "xPos2"].flatMap((pointName) => {
        if ((interval?.[pointName] ?? null) === null) {
          return [];
        }
        const side = interval[`${pointName}ClockSide`] ?? preferredSide;
        return [
          {
            ...getBoundaryPositions(
              interval[pointName],
              addPercentShift(
                clockXTransformPercent,
                size.timeIntervalClockWidth,
              ),
              side === "left",
            ),
            intervalId: interval.id,
            intervalIndex,
            pointName,
            side,
            isTimeInterval: true,
            collisionIndexes: [],
            type: "timeInterval",
          },
        ];
      }),
    ),
    {
      ...getBoundaryPositions(
        // `homeDayPassedXPos` is in viewport coordinates already (see `TimespaceClockSync`)
        homeDayPassedXPos,
        addPercentShift(clockXTransformPercent, size.timeZonesClockWidth),
        (timeZonesClock?.side ?? preferredSide) === "left",
      ),
      side: timeZonesClock?.side ?? preferredSide,
      isTimeInterval: false,
      collisionIndexes: [],
      type: "timeZonesClock",
    },
    {
      start:
        timeLineNameSide === "left"
          ? size.leftOffset + size.leftListOffset
          : size.hoursLineWidth +
            size.leftOffset +
            size.leftListOffset -
            size.maxHeaderWidth,
      end:
        timeLineNameSide === "left"
          ? size.maxHeaderWidth + size.leftOffset + size.leftListOffset
          : size.hoursLineWidth + size.leftOffset + size.leftListOffset,
      width: size.maxHeaderWidth,
      side: timeLineNameSide,
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
    })
    .map((item) => {
      if (
        item.type !== "timeLineName" &&
        (item.start < leftBoundary || item.end > rightBoundary)
      ) {
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

  // Prefer resolving an overlap horizontally before assigning vertical stack
  // lanes. A single deterministic pass is sufficient: every accepted switch
  // must avoid every item at its current position.
  allCollidedItems.forEach((clockBoundary, index) => {
    if (clockBoundary.type === "timeLineName") {
      return;
    }
    const hasCollision = allCollidedItems.some(
      (otherBoundary, otherIndex) =>
        otherIndex !== index &&
        boundariesOverlap(clockBoundary, otherBoundary),
    );
    if (!hasCollision) {
      return;
    }

    const switchedSideBoundary = calculateOppositeSidePosition(
      clockBoundary,
      clockBoundary.width,
      clockBoundary.side,
      leftBoundary,
      rightBoundary,
    );
    const didSwitch = switchedSideBoundary.side !== clockBoundary.side;
    const switchCausesCollision = allCollidedItems.some(
      (otherBoundary, otherIndex) =>
        otherIndex !== index &&
        boundariesOverlap(switchedSideBoundary, otherBoundary),
    );

    if (didSwitch && !switchCausesCollision) {
      allCollidedItems[index] = switchedSideBoundary;
    }
  });

  return addStackLayout(allCollidedItems);
}
