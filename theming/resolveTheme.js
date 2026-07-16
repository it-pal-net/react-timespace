import themePresets from "./themes";

const isPresetShaped = (input) => Boolean(input && (input.light || input.dark));

// Turns a preset name ("dracula"), a preset-shaped object ({light, dark,
// size, ...}) or an already-flat theme into the flat theme object the
// Timespace components read. Returns null for unknown preset names so the
// caller can fall back.
export default function resolveTheme(input, { mode = "dark", themes } = {}) {
  if (!input) {
    return null;
  }

  const registry = themes ?? themePresets;
  const preset = typeof input === "string" ? registry[input] : input;
  if (!preset) {
    return null;
  }

  if (!isPresetShaped(preset)) {
    return { mode, ...preset };
  }

  const modeData = preset[mode] ?? preset.dark ?? preset.light;

  return {
    name: preset.name,
    mode,
    font: preset.font,
    uiScale: Number(preset.uiScale ?? 1),
    color: { ...(modeData?.color ?? {}) },
    background: modeData?.background,
    size: { ...(preset.size ?? {}) },
  };
}
