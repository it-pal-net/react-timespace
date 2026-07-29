// Types for the `react-timespace/tzOptions` subpath (source checkouts only —
// the published tarball exposes `.` and `./theme-config`).

import type { TimeZoneOption } from "./index";

export type { TimeZoneOption } from "./index";

/** Every bundled IANA zone, as `<select>`-ready options. */
declare const tzOptions: TimeZoneOption[];
export default tzOptions;

/** Grouped zone options for a picker with sections. */
export declare const tzPresets: Array<{
  label: string;
  zones: TimeZoneOption[];
}>;
