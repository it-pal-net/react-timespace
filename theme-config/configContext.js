import { createContext, useContext } from "react";

// Carries per-instance configuration down the configurator tree: host-provided
// component slots (Select, Input, GradientPicker, ImagePicker) and the color
// key → label map.
export const ThemeConfigContext = createContext({
  components: {},
  colorLabels: {},
});

export const useThemeConfigContext = () => useContext(ThemeConfigContext);
