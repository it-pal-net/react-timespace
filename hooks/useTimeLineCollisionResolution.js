import { useCallback } from "react";

import { calculateFontSize, calculateTopOffset } from "../core/timeLineMath";

const capitalizeFirstLetter = (string) =>
  string ? `${string.charAt(0).toUpperCase()}${string.slice(1)}` : "";

export default function useTimeLineCollisionResolution({
  size,
  zIndexFloors,
  setColliderState,
  tzState,
  tzDispatch,
  updateTimeInterval,
}) {
  const applyCollisionResolution = useCallback(
    (fixedCollisions, dataAcc) => {
      const headersCollide =
        fixedCollisions.find((item) => item?.type === "timeLineName")
          ?.collisionIndexes?.length > 0;
      const timeZonesClockCollide =
        (fixedCollisions.find(
          (item) => !item.isTimeInterval && item?.type !== "timeLineName",
        )?.collisionIndexes?.length ?? 0) > 0;

      const newColliderState = (initialState) => {
        const fixedCollisionsMap = fixedCollisions.reduce(
          (acc, item, index) => {
            if (item.type === "timeInterval") {
              acc.timeInterval[item.pointName] = {
                ...item,
                index,
              };
              return acc;
            }
            acc[item.type] = {
              ...item,
              index,
            };
            return acc;
          },
          {
            timeInterval: {},
          },
        );
        return fixedCollisions.reduce((acc, item, index) => {
          const collidedItems = (item.collisionIndexes ?? []).length;
          const isCollided = collidedItems !== 0;

          const paddingTop = size.timeLineItemHeaderHeight / 2;
          let top = isCollided
            ? calculateTopOffset(
                size.timeLineItemHeaderHeight + paddingTop,
                size.timeLineItemHeaderHeight,
                collidedItems + 1,
              )[0]
            : 0;
          let fontSize = isCollided
            ? calculateFontSize(
                size.timeLineItemHeaderHeight + paddingTop,
                collidedItems + 1,
              )
            : "1em";
          let zIndex = zIndexFloors.head;
          switch (item?.type) {
            case "timeLineName":
              acc.timeLineName = {
                ...acc.timeLineName,
                // side: item.side,
                isCollided,
                fontSize,
                // The name is shrunk via `transform: scale` (see `TimeLineRow`) so its
                // measured width stays natural. Convert the target font size to a scale
                // relative to the natural header font.
                scale:
                  isCollided && size.headerFontPx
                    ? (parseFloat(fontSize) || size.headerFontPx) /
                      size.headerFontPx
                    : 1,
                zIndex,
                top,
              };
              break;
            case "timeZonesClock": {
              const isInterTimePointsCollided =
                fixedCollisionsMap.timeInterval.xPos1?.collisionIndexes.includes(
                  fixedCollisionsMap.timeInterval.xPos2?.index,
                );
              if (!isInterTimePointsCollided && isCollided) {
                fontSize = calculateFontSize(
                  size.timeLineItemHeaderHeight + paddingTop,
                  2,
                );
                top = calculateTopOffset(
                  size.timeLineItemHeaderHeight + paddingTop,
                  size.timeLineItemHeaderHeight,
                  2,
                )[0];
                /*
                zIndex -= 1;
                */
              }
              acc.timeZonesClock = {
                side: item.side,
                isCollided,
                fontSize,
                zIndex: zIndex + 1,
                top,
              };
              break;
            }
            case "timeInterval": {
              const oppositePointName =
                item.pointName === "xPos1" ? "xPos2" : "xPos1";

              const isTimeZonesClockCollide =
                isCollided &&
                fixedCollisionsMap.timeZonesClock.collisionIndexes.includes(
                  index,
                );
              const isTimeLineNameCollide =
                isCollided &&
                fixedCollisionsMap.timeLineName.collisionIndexes.includes(
                  index,
                );
              const isOppositeTimePointCollide =
                isCollided &&
                fixedCollisionsMap.timeInterval[
                  oppositePointName
                ]?.collisionIndexes.includes(index);

              let topPlace = item.pointName === "xPos1" ? 0 : 1;
              if (
                (isTimeZonesClockCollide || isTimeLineNameCollide) &&
                !isOppositeTimePointCollide
              ) {
                topPlace = 1;
              }
              if (
                (isTimeZonesClockCollide || isTimeLineNameCollide) &&
                isOppositeTimePointCollide
              ) {
                topPlace += 1;
              }
              zIndex -= topPlace;
              top = isCollided
                ? calculateTopOffset(
                    size.timeLineItemHeaderHeight + paddingTop,
                    size.timeLineItemHeaderHeight,
                    collidedItems + 1,
                  )[topPlace]
                : 0;
              acc[`timeInterval${capitalizeFirstLetter(item.pointName)}`] = {
                side: item.side,
                isCollided,
                fontSize,
                zIndex,
                top,
              };
              break;
            }
            default:
              break;
          }
          return acc;
        }, initialState);
      };
      setColliderState((s) => {
        const next = newColliderState(s);
        // Avoid pointless re-renders during drag: bail out if nothing changed.
        if (
          s.timeZonesClock.side === next.timeZonesClock.side &&
          s.timeZonesClock.isCollided === next.timeZonesClock.isCollided &&
          s.timeZonesClock.fontSize === next.timeZonesClock.fontSize &&
          s.timeZonesClock.zIndex === next.timeZonesClock.zIndex &&
          s.timeZonesClock.top === next.timeZonesClock.top &&
          s.timeLineName.side === next.timeLineName.side &&
          s.timeLineName.isCollided === next.timeLineName.isCollided &&
          s.timeLineName.fontSize === next.timeLineName.fontSize &&
          s.timeLineName.scale === next.timeLineName.scale &&
          s.timeLineName.zIndex === next.timeLineName.zIndex &&
          s.timeLineName.top === next.timeLineName.top &&
          s.timeIntervalXPos1.side === next.timeIntervalXPos1.side &&
          s.timeIntervalXPos1.isCollided ===
            next.timeIntervalXPos1.isCollided &&
          s.timeIntervalXPos1.fontSize === next.timeIntervalXPos1.fontSize &&
          s.timeIntervalXPos1.zIndex === next.timeIntervalXPos1.zIndex &&
          s.timeIntervalXPos1.top === next.timeIntervalXPos1.top &&
          s.timeIntervalXPos2.side === next.timeIntervalXPos2.side &&
          s.timeIntervalXPos2.isCollided ===
            next.timeIntervalXPos2.isCollided &&
          s.timeIntervalXPos2.fontSize === next.timeIntervalXPos2.fontSize &&
          s.timeIntervalXPos2.zIndex === next.timeIntervalXPos2.zIndex &&
          s.timeIntervalXPos2.top === next.timeIntervalXPos2.top
        ) {
          return s;
        }
        return next;
      });

      // If we don't have an interval id (e.g. no interval selected), don't dispatch.
      if ((dataAcc?.id ?? null) === null) {
        return;
      }

      let colideIndex = timeZonesClockCollide || headersCollide ? 1 : 0;
      const collisionPatch = fixedCollisions
        .filter((item) => item.isTimeInterval)
        .reduce((acc, item) => {
          const isItemCollided = (item.collisionIndexes ?? []).length > 0;
          acc[`${item.pointName}ClockSide`] = item.side;
          acc[`${item.pointName}ClockCollide`] = isItemCollided;
          acc[`${item.pointName}ClockCollideIndex`] = isItemCollided
            ? colideIndex
            : null;
          if (isItemCollided) {
            colideIndex += 1;
          }
          return acc;
        }, {});

      const nextInterval = { ...dataAcc, ...collisionPatch };
      const currentInterval = tzState.timeIntervalsMap[dataAcc.id];
      const changed =
        currentInterval == null ||
        Object.keys(nextInterval).some(
          (k) => !Object.is(nextInterval[k], currentInterval[k]),
        );

      if (changed) {
        tzDispatch(updateTimeInterval(nextInterval));
      }
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
