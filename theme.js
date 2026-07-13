// Minimal theme contract the Timespace components read. Host apps that mount
// their own emotion ThemeProvider override any of these keys; standalone use
// works with no provider at all.
export const defaultTimespaceTheme = {
  mode: "light",
  uiScale: 1,
  color: {
    intervalHandBody: "#39adb5",
  },
  size: {
    borderHour: 2,
    clockHand: 3,
  },
};

export const withThemeDefaults = (outerTheme) => ({
  ...defaultTimespaceTheme,
  ...outerTheme,
  color: {
    ...defaultTimespaceTheme.color,
    ...(outerTheme?.color ?? {}),
  },
  size: {
    ...defaultTimespaceTheme.size,
    ...(outerTheme?.size ?? {}),
  },
});
