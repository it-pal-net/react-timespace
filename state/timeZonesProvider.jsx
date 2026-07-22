import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useReducer,
} from "react";
import PropTypes from "prop-types";

import useLocalStorage from "../hooks/useLocalStorage";
import { combinedKeyValueReducer } from "./keyValueReducer";
import * as actionTypes from "./actionTypes";

function getLocalTimeZone() {
  let { timeZone } = Intl.DateTimeFormat().resolvedOptions();

  if (timeZone === "Asia/Saigon") {
    timeZone = "Asia/Ho_Chi_Minh";
  }

  return timeZone;
}

export const TimeZonesContext = createContext();
export const TimeZonesClockContext = createContext();
export const InternalTimeZonesContext = createContext();
export const InternalTimeZonesClockContext = createContext();

/**
 * Helper hook: returns the active clock/tick context value regardless of whether
 * the caller is under `TimeZonesProvider` or `InternalTimeZonesProvider`.
 */
export function useTimeZonesClock() {
  const external = useContext(TimeZonesClockContext);
  const internal = useContext(InternalTimeZonesClockContext);
  // Prefer internal when present: many UI pieces mount an InternalTimeZonesProvider
  // inside an app-level TimeZonesProvider, and internal should win in that subtree.
  return internal ?? external;
}

function getDateNowInZone({ timeZone, localeZoneOffsetMinutes = 0 }) {
  const localePureDateNow = new Date();
  const nowInLocaleZoneWithOffset = new Date(
    localePureDateNow.getTime() + localeZoneOffsetMinutes * 60 * 1000,
  );
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
    timeZone,
  });

  const nowInHomeZoneWithOffset = new Date(
    formatter.format(nowInLocaleZoneWithOffset),
  );
  return {
    nowInHomeZoneWithOffset,
    nowInLocaleZoneWithOffset,
    localePureDateNow,
  };
}

const resourcesReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_RESOURCES: {
      const { resourceName, keepTemporary = false, payload } = action;

      let temporaryIds = [];
      let temporaryMap = {};
      if (keepTemporary) {
        temporaryIds = state[`${resourceName}Ids`].filter((id) =>
          id.startsWith(`temp-${keepTemporary}-`),
        );
        temporaryMap = temporaryIds.reduce((acc, id) => {
          acc[id] = state[`${resourceName}Map`][id];
          return acc;
        }, {});
      }

      const { resourceIds, resourceMap } = payload.reduce(
        (acc, resourceItem) => {
          acc.resourceMap[resourceItem.id] = resourceItem;
          acc.resourceIds.push(resourceItem.id);
          return acc;
        },
        {
          resourceIds: keepTemporary ? temporaryIds : [],
          resourceMap: keepTemporary ? temporaryMap : {},
        },
      );
      return {
        ...state,
        [`${resourceName}Ids`]: resourceIds,
        [`${resourceName}Map`]: resourceMap,
      };
    }
    case actionTypes.SET_RESOURCE: {
      const { resourceName, payload } = action;
      return {
        ...state,
        [`${resourceName}Ids`]: [
          ...state[`${resourceName}Ids`],
          state[`${resourceName}Ids`].find((id) => id === payload.id)
            ? null
            : payload.id,
        ].filter(Boolean),
        [`${resourceName}Map`]: {
          ...state[`${resourceName}Map`],
          [payload.id]: payload,
        },
      };
    }
    case actionTypes.UPDATE_RESOURCE: {
      const { resourceName, payload } = action;
      return {
        ...state,
        [`${resourceName}Ids`]: [
          ...state[`${resourceName}Ids`],
          state[`${resourceName}Ids`].find((id) => id === payload.id)
            ? null
            : payload.id,
        ].filter(Boolean),
        [`${resourceName}Map`]: {
          ...state[`${resourceName}Map`],
          [payload.id]: {
            ...state[`${resourceName}Map`][payload.id],
            ...payload,
          },
        },
      };
    }
    case actionTypes.ADD_RESOURCE: {
      const { resourceName, payload } = action;
      return {
        ...state,
        [`${resourceName}Ids`]: [...state[`${resourceName}Ids`], payload.id],
        [`${resourceName}Map`]: {
          ...state[`${resourceName}Map`],
          [payload.id]: payload,
        },
      };
    }
    case actionTypes.DELETE_RESOURCE: {
      const { resourceName, payload } = action;
      const resourceId = payload;
      const { [resourceId]: deleted, ...resourceMap } =
        state[`${resourceName}Map`];
      return {
        ...state,
        [`${resourceName}Ids`]: state[`${resourceName}Ids`].filter(
          (id) => id !== resourceId,
        ),
        [`${resourceName}Map`]: resourceMap,
      };
    }
    default:
      return state;
  }
};
const defaultIntervalStep = 5 * 60;

const initialState = {
  isEditMode: false,
  homeZone: getLocalTimeZone(),
  localZone: getLocalTimeZone(),
  localeZoneOffsetMinutes: 0,
  intervalStepSeconds: defaultIntervalStep,

  timeLinesIds: [],
  timeLinesMap: {},

  timeIntervalsIds: [],
  timeIntervalsMap: {},
};

export const createTimeZonesProvider =
  (TZContext, TZClockContext) =>
  ({ children, intervalSeconds = 1, timeFormat: timeFormatProp }) => {
    const [state, dispatch] = useReducer(
      combinedKeyValueReducer(resourcesReducer),
      initialState,
    );
    // Controlled (URL-driven hosts like the /timespace playground) pass
    // timeFormat as a prop; uncontrolled hosts (the app) read it from
    // localStorage.
    const [storedTimeFormat] = useLocalStorage("timeFormat", "24");
    const timeFormat =
      timeFormatProp === "12" || timeFormatProp === "24"
        ? timeFormatProp
        : storedTimeFormat;

    // Self-correcting ticker aligned to the next interval boundary.
    // This keeps "seconds ticking" visually consistent even if the main thread stalls briefly.
    const intervalMs = intervalSeconds * 1000;
    const [timer, setTimer] = useState(() => Math.floor(Date.now() / 1000));
    useEffect(() => {
      let timeoutId = null;
      let cancelled = false;

      const schedule = () => {
        if (cancelled) return;
        const now = Date.now();
        const nextBoundary = Math.ceil(now / intervalMs) * intervalMs;
        const delay = Math.max(0, nextBoundary - now);
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          setTimer(Math.floor(Date.now() / 1000));
          schedule();
        }, delay);
      };

      schedule();
      return () => {
        cancelled = true;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [intervalMs]);

    const timeLines = useMemo(() => {
      return state.timeLinesIds
        .map((id) => state.timeLinesMap[id])
        .sort((a, b) => {
          return a.orderId - b.orderId;
        });
    }, [state.timeLinesIds, state.timeLinesMap]);

    const timeIntervals = useMemo(() => {
      return state.timeIntervalsIds.map((id) => state.timeIntervalsMap[id]);
    }, [state.timeIntervalsIds, state.timeIntervalsMap]);

    const timeZones = useMemo(
      () => timeLines.map((timeLine) => timeLine.timeZone),
      [timeLines],
    );

    const timeZoneFormatters = useMemo(() => {
      return timeZones.reduce((acc, timeZone) => {
        acc[timeZone] = {
          clock: new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: timeFormat === "24" ? "h23" : "h12",
            timeZoneName: "short",
            timeZone,
          }),
          offset: new Intl.DateTimeFormat("en-US", {
            hourCycle: "h23",
            timeZoneName: "longOffset",
            timeZone,
          }),
        };
        return acc;
      }, {});
    }, [timeZones, timeFormat]);

    const [timeZonesClock, dateNowHome, dayNowHome] = useMemo(() => {
      const {
        nowInHomeZoneWithOffset,
        nowInLocaleZoneWithOffset,
        localePureDateNow,
      } = getDateNowInZone({
        timeZone: state.homeZone,
        localeZoneOffsetMinutes: state.localeZoneOffsetMinutes,
      });

      const clock = timeZones.reduce((acc, timeZone) => {
        try {
          const formatter = timeZoneFormatters[timeZone]?.clock;
          const formatterOffset = timeZoneFormatters[timeZone]?.offset;
          if (!formatter || !formatterOffset) {
            return acc;
          }

          const parts = formatter
            .formatToParts(nowInLocaleZoneWithOffset)
            .reduce((ac, part) => {
              ac[part.type] = part.value;
              return ac;
            }, {});
          const partsOffset = formatterOffset
            .formatToParts(nowInLocaleZoneWithOffset)
            .find((part) => part.type === "timeZoneName");
          const offsetMatch = partsOffset.value.match(
            /(?:GMT|UTC)([+-]\d{2}):(\d{2})/,
          );

          let timeZoneOffsetSeconds = 0;
          let timeZoneOffset = "";
          if (offsetMatch) {
            const offsetHours = parseInt(offsetMatch[1], 10);
            const offsetMinutes = parseInt(offsetMatch[2], 10);
            timeZoneOffsetSeconds = offsetHours * 3600 + offsetMinutes * 60;
            timeZoneOffset = `UTC${offsetHours > 0 ? "+" : ""}${offsetHours}`;
          }

          let timeZoneAbbreviation = parts.timeZoneName.replace("GMT", "UTC");
          if (!timeZoneAbbreviation.includes("UTC")) {
            timeZoneAbbreviation = `${timeZoneAbbreviation} ${timeZoneOffset}`;
          }

          const formattedTime =
            timeFormat === "24"
              ? `${parts.hour}:${parts.minute}:${parts.second}`
              : `${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod?.toUpperCase() || ""}`;

          acc[timeZone] = {
            hoursMinutesSeconds: formattedTime,
            hoursMinutes: `${parts.hour}:${parts.minute} ${parts.dayPeriod?.toUpperCase() || ""}`,

            timeZoneAbbreviation,
            timeZoneOffsetSeconds,
            timeZoneOffset,
          };
        } catch (error) {
          console.error("Error in getTimeZoneClock", error);
        }
        return acc;
      }, {});

      return [
        clock,
        nowInHomeZoneWithOffset,
        nowInHomeZoneWithOffset.getDate(),
      ];
    }, [
      timer,
      timeZones,
      timeZoneFormatters,
      state.homeZone,
      state.localeZoneOffsetMinutes,
    ]);

    const [startOfThisDay, endOfThisDay] = useMemo(() => {
      const start = new Date(dateNowHome);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateNowHome);
      end.setHours(23, 59, 59, 999);

      return [start, end];
    }, [dayNowHome]);

    const homeDayPassedPercent = useMemo(() => {
      const percent =
        ((dateNowHome - startOfThisDay.getTime()) /
          (endOfThisDay.getTime() - startOfThisDay.getTime())) *
        100;
      return percent;
    }, [dateNowHome]);

    const dataContextValue = useMemo(() => {
      return {
        tzState: state,
        tzDispatch: dispatch,
        timeZones,
        timeLines,
        timeIntervals,
      };
    }, [state, timeZones, timeLines, timeIntervals]);

    const clockContextValue = useMemo(() => {
      return {
        // tick counter; useful for downstream throttling without recomputing clocks everywhere
        timer,
        startOfThisDay,
        endOfThisDay,
        timeZonesClock,
        homeDayPassedPercent,
      };
    }, [
      timer,
      startOfThisDay,
      endOfThisDay,
      timeZonesClock,
      homeDayPassedPercent,
    ]);

    return (
      <TZContext.Provider value={dataContextValue}>
        <TZClockContext.Provider value={clockContextValue}>
          {children}
        </TZClockContext.Provider>
      </TZContext.Provider>
    );
  };

export const TimeZonesProvider = createTimeZonesProvider(
  TimeZonesContext,
  TimeZonesClockContext,
);
export const InternalTimeZonesProvider = createTimeZonesProvider(
  InternalTimeZonesContext,
  InternalTimeZonesClockContext,
);

TimeZonesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
