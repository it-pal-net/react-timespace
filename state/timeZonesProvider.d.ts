// Types for the `react-timespace/state/timeZonesProvider` subpath (source
// checkouts only — the published tarball exposes `.` and `./theme-config`).

import type { ComponentType, Context } from "react";
import type {
  TimeZonesClockContextValue,
  TimeZonesContextValue,
  TimeZonesProviderProps,
} from "../index";

export type {
  TimeZoneClock,
  TimeZonesClockContextValue,
  TimeZonesContextValue,
  TimeZonesDispatch,
  TimeZonesProviderProps,
  TimeZonesState,
} from "../index";

export {
  TimeZonesProvider,
  InternalTimeZonesProvider,
  TimeZonesContext,
  TimeZonesClockContext,
  InternalTimeZonesContext,
  InternalTimeZonesClockContext,
  useTimeZonesClock,
} from "../index";

/**
 * Builds a provider bound to a specific pair of contexts. Used to derive both
 * the app-level and the internal provider from one implementation.
 */
export declare function createTimeZonesProvider(
  TZContext: Context<TimeZonesContextValue>,
  TZClockContext: Context<TimeZonesClockContextValue>,
): ComponentType<TimeZonesProviderProps>;
