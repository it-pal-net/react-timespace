import { useCallback } from "react";

import { calculateFontSize, calculateTopOffset } from "../core/timeLineMath";

const layoutKeys = [
  "side",
  "isCollided",
  "fontSize",
  "scale",
  "zIndex",
  "top",
];

const isSameLayout = (first, second) =>
  layoutKeys.every((key) => Object.is(first?.[key], second?.[key]));

const areIntervalLayoutsEqual = (first = {}, second = {}) => {
  const firstIds = Object.keys(first);
  const secondIds = Object.keys(second);
  if (
    firstIds.length !== secondIds.length ||
    firstIds.some(
      (id) => !Object.prototype.hasOwnProperty.call(second, id),
    )
  ) {
    return false;
  }

  return firstIds.every((id) =>
    ["xPos1", "xPos2"].every((pointName) => {
      const firstLayout = first[id]?.[pointName];
      const secondLayout = second[id]?.[pointName];
      return firstLayout == null && secondLayout == null
        ? true
        : isSameLayout(firstLayout, secondLayout);
    }),
  );
};

export default function useTimeLineCollisionResolution({
  size,
  zIndexFloors,
  setColliderState,
  tzState,
  tzDispatch,
  updateTimeInterval,
}) {
  const applyCollisionResolution = useCallback(
    (fixedCollisions, intervalData) => {
      const newColliderState = (initialState) => {
        const nextState = {
          ...initialState,
          timeIntervals: {},
        };
        const paddingTop = size.timeLineItemHeaderHeight / 2;
        const totalAvailableHeight =
          size.timeLineItemHeaderHeight + paddingTop;

        fixedCollisions.forEach((item) => {
          const isCollided = (item.collisionIndexes ?? []).length > 0;
          const stackSize = Math.max(1, item.stackSize ?? 1);
          const stackIndex = Math.min(
            Math.max(0, item.stackIndex ?? 0),
            stackSize - 1,
          );
          const fontSize = isCollided
            ? calculateFontSize(totalAvailableHeight, stackSize)
            : "1em";
          const top = isCollided
            ? calculateTopOffset(
                totalAvailableHeight,
                size.timeLineItemHeaderHeight,
                stackSize,
              )[stackIndex]
            : 0;
          const layout = {
            side: item.side,
            isCollided,
            fontSize,
            zIndex: zIndexFloors.head - stackIndex,
            top,
          };

          switch (item.type) {
            case "timeLineName":
              nextState.timeLineName = {
                ...layout,
                // Keep the measured header width natural so collision decisions
                // do not oscillate as its visual size changes.
                scale:
                  isCollided && size.headerFontPx
                    ? (parseFloat(fontSize) || size.headerFontPx) /
                      size.headerFontPx
                    : 1,
              };
              break;
            case "timeZonesClock":
              nextState.timeZonesClock = {
                ...layout,
                zIndex: zIndexFloors.head + 1 - stackIndex,
              };
              break;
            case "timeInterval":
              nextState.timeIntervals[item.intervalId] ??= {};
              nextState.timeIntervals[item.intervalId][item.pointName] =
                layout;
              break;
            default:
              break;
          }
        });

        return nextState;
      };

      setColliderState((currentState) => {
        const nextState = newColliderState(currentState);
        if (
          isSameLayout(
            currentState.timeZonesClock,
            nextState.timeZonesClock,
          ) &&
          isSameLayout(currentState.timeLineName, nextState.timeLineName) &&
          areIntervalLayoutsEqual(
            currentState.timeIntervals,
            nextState.timeIntervals,
          )
        ) {
          return currentState;
        }
        return nextState;
      });

      const intervals = Array.isArray(intervalData)
        ? intervalData
        : intervalData
          ? [intervalData]
          : [];
      if (!intervals.length) {
        return;
      }

      const collisionItemsByInterval = fixedCollisions
        .filter((item) => item.isTimeInterval)
        .reduce((acc, item) => {
          acc[item.intervalId] ??= {};
          acc[item.intervalId][item.pointName] = item;
          return acc;
        }, {});

      intervals.forEach((interval) => {
        if ((interval?.id ?? null) === null) {
          return;
        }

        const collisionPatch = {};
        ["xPos1", "xPos2"].forEach((pointName) => {
          const item = collisionItemsByInterval[interval.id]?.[pointName];
          if (!item) {
            if ((interval[pointName] ?? null) === null) {
              collisionPatch[`${pointName}ClockCollide`] = false;
              collisionPatch[`${pointName}ClockCollideIndex`] = null;
            }
            return;
          }

          const isItemCollided = (item.collisionIndexes ?? []).length > 0;
          collisionPatch[`${pointName}ClockSide`] = item.side;
          collisionPatch[`${pointName}ClockCollide`] = isItemCollided;
          collisionPatch[`${pointName}ClockCollideIndex`] = isItemCollided
            ? item.stackIndex
            : null;
        });

        const nextInterval = { ...interval, ...collisionPatch };
        const currentInterval = tzState.timeIntervalsMap[interval.id];
        const changed =
          currentInterval == null ||
          Object.keys(nextInterval).some(
            (key) => !Object.is(nextInterval[key], currentInterval[key]),
          );

        if (changed) {
          tzDispatch(updateTimeInterval(nextInterval));
        }
      });
    },
    [
      size,
      zIndexFloors,
      setColliderState,
      tzState,
      tzDispatch,
      updateTimeInterval,
    ],
  );

  return { applyCollisionResolution };
}
