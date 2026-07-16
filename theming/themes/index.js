import defaultTheme from "./default";
import draculaTheme from "./dracula";
import draculaVTheme from "./draculaV";
import terminalTheme from "./terminal";
import solarizedTheme from "./solarized";
import solarizedArrakisTheme from "./solarizedArrakis";
import monokaiTheme from "./monokai";
import oneDarkTheme from "./oneDark";
import gruvboxTheme from "./gruvbox";
import nordTheme from "./nord";
import tomorrowTheme from "./tomorrow";
import palenightTheme from "./palenight";
import nightOwlTheme from "./nightOwl";
import materialTheme from "./material";
import cobalt2Theme from "./cobalt2";

// Labels for the color keys the Timespace widget itself reads. Host apps merge
// their own labels on top for any extra keys their themes carry.
export const colorLabels = {
  text: "Text",
  borderHour: "Border",
  clockHandBody: "Clock hand",
  clockHandTail: "Clock hand tail",
  intervalHandBody: "Interval hand",
};

const themePresets = {
  default: defaultTheme,
  dracula: draculaTheme,
  draculaV: draculaVTheme,
  terminal: terminalTheme,
  solarized: solarizedTheme,
  solarizedArrakis: solarizedArrakisTheme,
  monokai: monokaiTheme,
  oneDark: oneDarkTheme,
  gruvbox: gruvboxTheme,
  nord: nordTheme,
  tomorrow: tomorrowTheme,
  palenight: palenightTheme,
  nightOwl: nightOwlTheme,
  material: materialTheme,
  cobalt2: cobalt2Theme,
};

export default themePresets;
