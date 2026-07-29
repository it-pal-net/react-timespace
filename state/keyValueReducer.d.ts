// Types for the `react-timespace/state/keyValueReducer` subpath (source
// checkouts only — the published tarball exposes `.` and `./theme-config`).

import type { TimeZonesAction } from "../index";

export type { TimeZonesAction } from "../index";

export type Reducer<S> = (state: S, action: TimeZonesAction) => S;

/** Handles `SET_STATE` / `SET_UI_STATE`; returns `state` untouched otherwise. */
declare const keyValueReducer: Reducer<any>;
export default keyValueReducer;

/**
 * Wraps a resource reducer so state-key actions are handled here and
 * everything else falls through to `combineReducer`.
 */
export declare function combinedKeyValueReducer<S>(
  combineReducer: Reducer<S>,
): Reducer<S>;
