import styled from "@emotion/styled";

// Design tokens. Each `--tsc-*` var reads the host app's token first
// (SyncContact defines `--text`, `--background-brand-bold`, … globally) and
// falls back to a mode-appropriate default so the configurator renders
// correctly in apps that define none of them.
export const themeConfigTokens = ({ theme }) => {
  const light = theme?.mode === "light";
  return `
    --tsc-text: var(--text, ${light ? "#172b4d" : "#b6c2cf"});
    --tsc-text-subtle: var(--text-subtle, ${light ? "#44546f" : "#9fadbc"});
    --tsc-text-inverse: var(--text-inverse, ${light ? "#ffffff" : "#1d2125"});
    --tsc-brand: var(--background-brand-bold, ${light ? "#0c66e4" : "#579dff"});
    --tsc-brand-hovered: var(
      --background-brand-bold-hovered,
      ${light ? "#0055cc" : "#85b8ff"}
    );
    --tsc-neutral: var(--background-neutral, ${light ? "#0515240f" : "#ceced912"});
    --tsc-neutral-hovered: var(
      --background-neutral-hovered,
      ${light ? "#091e4224" : "#a6c5e229"}
    );
    --tsc-surface: var(--background-surface, ${light ? "#f1f2f4" : "#323940"});
    --tsc-input: var(
      --background-input,
      var(--background-surface, ${light ? "#ffffff" : "#22272b"})
    );
    --tsc-overlay: var(
      --surface-overlay,
      var(--background-surface, ${light ? "#ffffff" : "#282e33"})
    );
    --tsc-shadow-overlay: var(
      --shadow-overlay,
      ${
        light
          ? "0px 8px 12px #091e4226, 0px 0px 1px #091e424f"
          : "0 10px 28px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3)"
      }
    );
    --tsc-orange: var(--background-accent-orange-bolder, #f5a623);
    --tsc-text-orange: var(--text-accent-orange, ${light ? "#974f0c" : "#f5a623"});
    --tsc-danger: var(--background-danger, ${light ? "#ffeceb" : "#42221f"});
    --tsc-danger-bold: var(--background-danger-bold, ${light ? "#c9372c" : "#f87168"});
  `;
};

export const ThemeConfig = styled.div`
  ${themeConfigTokens}

  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  width: 100%;
  padding: 12px 18px 18px;
  gap: 18px;
  color: var(--tsc-text);
`;

export const CompactTabs = styled.div`
  display: flex;
  width: 100%;
  gap: 4px;
  border-bottom: 1px solid rgba(127, 127, 127, 0.12);
  margin-top: -1px;
`;

export const CompactTab = styled.button`
  border: 0;
  border-bottom: 2px solid
    ${({ isActive }) => (isActive ? "var(--tsc-brand)" : "transparent")};
  background: transparent;
  color: ${({ isActive }) =>
    isActive ? "var(--tsc-text)" : "var(--tsc-text-subtle)"};
  border-radius: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px 9px;
  min-height: 32px;
  font-size: 13px;
  line-height: 1.15;
  font-weight: ${({ isActive }) => (isActive ? 600 : 500)};
  cursor: pointer;
  transition:
    border-color 180ms ease,
    color 150ms ease,
    background-color 150ms ease;

  &:hover {
    color: var(--tsc-text);
    border-bottom-color: ${({ isActive }) =>
      isActive ? "var(--tsc-brand)" : "var(--tsc-neutral-hovered)"};
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

// Tab-less layout: each former tab becomes an always-open, labelled group so
// the whole configurator reads as one scroll (used by the standalone widget,
// where switching App/Time Zones/Background tabs is needless chrome).
export const ConfigGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const GroupHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding-bottom: 11px;
  border-bottom: 1px solid rgba(127, 127, 127, 0.14);
  color: var(--tsc-text);
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.01em;

  svg {
    color: var(--tsc-brand);
  }
`;

export const PresetToolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const PresetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
  padding: 0 2px;
`;

export const PresetRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const PresetSelectWrap = styled.div`
  flex: 1;
  min-width: 0;
`;

export const SelectValueWithDot = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
`;

export const DirtyDot = styled.span`
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  margin-left: 8px;
  border-radius: 50%;
  background: var(--tsc-orange);
`;

export const PrimaryActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: var(--tsc-brand);
  color: var(--tsc-text-inverse);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 140ms ease;

  &:hover {
    background: var(--tsc-brand-hovered);
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 2px;
  }
`;

export const SubtleActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(127, 127, 127, 0.26);
  border-radius: 6px;
  background: transparent;
  color: var(--tsc-text);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    background-color 140ms ease;

  &:hover {
    border-color: rgba(127, 127, 127, 0.4);
    background: rgba(127, 127, 127, 0.12);
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }
`;

export const FooterBar = styled.div`
  @keyframes footerIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  position: sticky;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-sizing: border-box;
  margin: auto -18px -18px;
  padding: 10px 18px;
  border-top: 1px solid rgba(127, 127, 127, 0.2);
  background: ${({ theme }) =>
    theme.mode === "dark" ? "rgb(43, 52, 65)" : "rgb(233, 238, 245)"};
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  animation: footerIn 150ms ease;
`;

export const FooterStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
  color: var(--tsc-text-orange);

  &::before {
    content: "";
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--tsc-orange);
  }
`;

export const FooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SplitButton = styled.div`
  position: relative;
  display: inline-flex;
  align-items: stretch;
`;

export const SplitButtonMain = styled(PrimaryActionButton)`
  border-radius: 6px 0 0 6px;
`;

export const SplitButtonToggle = styled(PrimaryActionButton)`
  border-radius: 0 6px 6px 0;
  min-width: 26px;
  padding: 0 5px;
  border-left: 1px solid rgba(0, 0, 0, 0.2);
`;

export const MenuAnchor = styled.div`
  position: relative;
  display: inline-flex;
`;

export const KebabButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(127, 127, 127, 0.26);
  border-radius: 6px;
  background: var(--tsc-neutral);
  color: var(--tsc-text-subtle);
  cursor: pointer;
  transition:
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;

  &:hover {
    color: var(--tsc-text);
    border-color: rgba(127, 127, 127, 0.42);
    background: var(--tsc-surface);
  }

  &[aria-expanded="true"] {
    color: var(--tsc-text);
    border-color: var(--tsc-brand);
    background: var(--tsc-surface);
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }
`;

export const MenuPopover = styled.div`
  position: absolute;
  top: ${({ placement }) =>
    placement === "top" ? "auto" : "calc(100% + 6px)"};
  bottom: ${({ placement }) =>
    placement === "top" ? "calc(100% + 6px)" : "auto"};
  right: 0;
  z-index: 60;
  min-width: 180px;
  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.28);
  background: var(--tsc-overlay);
  box-shadow: var(--tsc-shadow-overlay);
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  background: transparent;
  color: ${({ variant }) =>
    variant === "danger" ? "var(--tsc-danger-bold)" : "var(--tsc-text)"};
  font-size: 12px;
  line-height: 1.2;
  padding: 8px 10px;
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
  transition:
    background-color 150ms ease,
    color 150ms ease;

  &:hover {
    background: ${({ variant }) =>
      variant === "danger"
        ? "var(--tsc-danger)"
        : "var(--tsc-neutral-hovered)"};
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: -1px;
  }
`;

export const MenuSeparator = styled.div`
  height: 1px;
  margin: 3px 6px;
  background: rgba(127, 127, 127, 0.18);
`;

export const CompactSectionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  padding: 0;

  & + & {
    margin-top: 18px;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 20px;
  padding: 0 2px;
  text-align: left;
  color: var(--tsc-text);
`;

export const SectionHeaderTitle = styled.div`
  font-size: 11px;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 650;
  opacity: 0.85;
`;

export const SectionHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.7;
  transition: opacity 150ms ease;

  ${CompactSectionCard}:hover &,
  ${CompactSectionCard}:focus-within & {
    opacity: 1;
  }
`;

export const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.18);
  background: ${({ theme }) =>
    theme.mode === "dark"
      ? "rgba(255, 255, 255, 0.03)"
      : "rgba(0, 0, 0, 0.025)"};
`;

export const CompactControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CompactControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
`;

export const ControlLabel = styled.div`
  font-size: 13px;
  line-height: 1.2;
  color: var(--tsc-text);
  font-weight: 500;
`;

export const SliderValueWrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
`;

export const SliderValueField = styled.input`
  box-sizing: border-box;
  width: 58px;
  height: 22px;
  padding: 0 22px 0 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: var(--tsc-neutral);
  color: var(--tsc-text);
  font-size: 11px;
  line-height: 1.2;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: right;
  transition:
    border-color 140ms ease,
    background-color 140ms ease;

  &:hover {
    border-color: rgba(127, 127, 127, 0.3);
  }

  &:focus {
    outline: none;
    border-color: var(--tsc-brand);
    background: var(--tsc-input);
  }
`;

export const InputSuffix = styled.span`
  position: absolute;
  right: 6px;
  font-size: 11px;
  line-height: 1;
  color: var(--tsc-text-subtle);
  pointer-events: none;
`;

const sliderTrackFill = ({ fillPercent = 0 }) => `
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--tsc-brand) ${fillPercent}%,
    var(--tsc-neutral-hovered) ${fillPercent}%
  );
`;

export const CompactSlider = styled.input`
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  margin: 0;
  height: 20px;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    ${sliderTrackFill}
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    margin-top: -5px;
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: #fff;
    box-shadow:
      0 1px 4px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba(0, 0, 0, 0.06);
    transition: box-shadow 120ms ease;
  }

  &::-moz-range-track {
    ${sliderTrackFill}
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: #fff;
    box-shadow:
      0 1px 4px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba(0, 0, 0, 0.06);
    transition: box-shadow 120ms ease;
  }

  &:hover::-webkit-slider-thumb,
  &:focus-visible::-webkit-slider-thumb {
    box-shadow:
      0 1px 4px rgba(0, 0, 0, 0.35),
      0 0 0 4px rgba(38, 132, 255, 0.25);
  }

  &:hover::-moz-range-thumb,
  &:focus-visible::-moz-range-thumb {
    box-shadow:
      0 1px 4px rgba(0, 0, 0, 0.35),
      0 0 0 4px rgba(38, 132, 255, 0.25);
  }

  &:focus-visible {
    outline: none;
  }
`;

export const CompactColorGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ColorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
`;

export const ColorRowLabel = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.2;
  color: var(--tsc-text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ColorSwatchButton = styled.button`
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid rgba(127, 127, 127, 0.28);
  border-radius: 6px;
  background-color: ${({ color }) => color || "transparent"};
  cursor: pointer;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    border-color: rgba(127, 127, 127, 0.45);
    box-shadow: 0 0 0 1px rgba(127, 127, 127, 0.14);
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }
`;

export const HexInput = styled.input`
  box-sizing: border-box;
  flex-shrink: 0;
  width: 74px;
  height: 26px;
  padding: 0 7px;
  border: 1px solid rgba(127, 127, 127, 0.24);
  border-radius: 5px;
  background: var(--tsc-input);
  color: var(--tsc-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.2;
  text-transform: uppercase;
  transition: border-color 140ms ease;

  &:hover {
    border-color: rgba(127, 127, 127, 0.34);
  }

  &:focus {
    outline: none;
    border-color: var(--tsc-brand);
  }
`;

export const AlphaInputWrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
`;

export const AlphaInput = styled.input`
  box-sizing: border-box;
  width: 52px;
  height: 26px;
  padding: 0 20px 0 6px;
  border: 1px solid rgba(127, 127, 127, 0.24);
  border-radius: 5px;
  background: var(--tsc-input);
  color: var(--tsc-text);
  font-size: 12px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  text-align: right;
  transition: border-color 140ms ease;

  &:hover {
    border-color: rgba(127, 127, 127, 0.34);
  }

  &:focus {
    outline: none;
    border-color: var(--tsc-brand);
  }
`;

export const InlineField = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const InlineTextInput = styled.input`
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  height: 32px;
  border: 1px solid rgba(127, 127, 127, 0.24);
  border-radius: 5px;
  background: var(--tsc-surface);
  color: var(--tsc-text);
  font-size: 13px;
  line-height: 1.2;
  padding: 0 10px;
  transition:
    border-color 150ms ease,
    background-color 150ms ease;

  &::placeholder {
    color: var(--tsc-text-subtle);
  }

  &:hover {
    border-color: rgba(127, 127, 127, 0.3);
  }

  &:focus {
    outline: none;
    border-color: var(--tsc-brand);
    background: rgba(127, 127, 127, 0.03);
  }
`;

export const SecondaryText = styled.div`
  color: var(--tsc-text-subtle);
  font-size: 12px;
  line-height: 1.3;
`;

export const ComboboxWrap = styled.div`
  position: relative;
  width: 100%;
`;

export const ComboboxInput = styled(InlineTextInput)`
  padding-right: 32px;
`;

export const ComboboxToggle = styled.button`
  position: absolute;
  right: 3px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--tsc-text-subtle);
  cursor: pointer;
  transition: color 140ms ease;

  &:hover {
    color: var(--tsc-text);
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }
`;

export const ComboboxList = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 60;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  border-radius: 6px;
  border: 1px solid rgba(127, 127, 127, 0.2);
  background: var(--tsc-overlay);
  box-shadow: var(--tsc-shadow-overlay);
`;

export const ComboboxOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  border: 0;
  background: ${({ isHighlighted }) =>
    isHighlighted ? "var(--tsc-neutral-hovered)" : "transparent"};
  color: var(--tsc-text);
  font-size: 12px;
  line-height: 1.2;
  padding: 8px 10px;
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
  transition: background-color 120ms ease;

  &:hover {
    background: var(--tsc-neutral-hovered);
  }
`;

export const ComboboxOptionMeta = styled.span`
  flex-shrink: 0;
  font-size: 11px;
  color: var(--tsc-text-subtle);
`;

export const SelectControl = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-height: 38px;
  padding: 2px 8px 2px 12px;
  border: 0;
  border-radius: 4px;
  background: var(--tsc-neutral);
  color: var(--tsc-text);
  font-size: 13px;
  line-height: 1.2;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms ease;

  &:hover {
    background: var(--tsc-surface);
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }
`;

export const SelectControlValue = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SelectGroupHeading = styled.div`
  padding: 8px 10px 4px;
  font-size: 11px;
  line-height: 1.2;
  color: var(--tsc-text-subtle);
`;

export const ColorPickerPopover = styled.div`
  ${themeConfigTokens}

  position: fixed;
  z-index: 1400;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.28);
  background: var(--tsc-overlay);
  box-shadow: var(--tsc-shadow-overlay);
`;

export const BackgroundPreviewCard = styled.button`
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 2px;
    border-radius: 10px;
  }
`;

export const BackgroundPreviewFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid
    ${({ isSelected }) =>
      isSelected ? "var(--tsc-brand)" : "rgba(127, 127, 127, 0.24)"};
  background: rgba(127, 127, 127, 0.12);
  box-shadow: ${({ isSelected }) =>
    isSelected
      ? "0 0 0 2px rgba(38, 132, 255, 0.18)"
      : "inset 0 0 0 1px rgba(127, 127, 127, 0.08)"};
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    filter 160ms ease,
    transform 160ms ease;

  ${BackgroundPreviewCard}:hover & {
    filter: brightness(1.04);
    border-color: rgba(38, 132, 255, 0.46);
    box-shadow: 0 0 0 2px rgba(38, 132, 255, 0.16);
    transform: translateY(-1px);
  }
`;

export const BackgroundPreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const BackgroundPreviewPlaceholder = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.22)),
    rgba(127, 127, 127, 0.1);
`;

export const BackgroundPreviewPlaceholderText = styled.div`
  position: relative;
  z-index: 2;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
`;

export const BackgroundPreviewCollage = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 2px;
  padding: 2px;
  box-sizing: border-box;
`;

export const BackgroundPreviewThumb = styled.div`
  border-radius: 5px;
  background-size: cover;
  background-position: center;
  opacity: 0.96;
  background-image: ${({ imageUrl }) =>
    imageUrl
      ? `url(${imageUrl})`
      : "linear-gradient(130deg, #7a8a9a, #b7c1cb)"};
`;

export const BackgroundPreviewBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  padding: 5px 8px;
`;

export const BackgroundPreviewHoverOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.42));
  opacity: 0;
  transition: opacity 150ms ease;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);

  ${BackgroundPreviewCard}:hover &,
  ${BackgroundPreviewCard}:focus-visible & {
    opacity: 1;
  }
`;

export const BackgroundPickerAction = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  border: 1px solid rgba(127, 127, 127, 0.26);
  border-radius: 6px;
  background: var(--tsc-surface);
  color: var(--tsc-text);
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  padding: 0 12px;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    color 150ms ease;

  &:hover {
    border-color: rgba(127, 127, 127, 0.4);
    background: rgba(127, 127, 127, 0.12);
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }
`;

export const BackgroundPickerOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: ${({ theme }) =>
    theme.mode === "dark" ? "rgba(8, 12, 18, 0.72)" : "rgba(16, 20, 28, 0.56)"};
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const BackgroundPickerDialog = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: min(1200px, 96vw);
  max-height: min(88vh, 900px);
  border-radius: 12px;
  border: 1px solid
    ${({ theme }) =>
      theme.mode === "dark"
        ? "rgba(255, 255, 255, 0.16)"
        : "rgba(22, 30, 44, 0.18)"};
  background: ${({ theme }) =>
    theme.mode === "dark"
      ? "rgba(21, 27, 36, 0.98)"
      : "rgba(246, 250, 255, 0.98)"};
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 54px rgba(0, 0, 0, 0.34);
  padding: 16px;
`;

export const BackgroundPickerHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const BackgroundPickerHeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const BackgroundPickerBody = styled.div`
  display: flex;
  min-height: 0;
  overflow: auto;
  border-radius: 8px;
  background: ${({ theme }) =>
    theme.mode === "dark"
      ? "rgba(255, 255, 255, 0.03)"
      : "rgba(0, 0, 0, 0.03)"};
  padding: 2px 4px 2px 0;
`;

export const IconActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--tsc-text-subtle);
  cursor: pointer;
  opacity: ${({ alwaysVisible }) => (alwaysVisible ? 0.85 : 0.75)};
  transition:
    background-color 150ms ease,
    color 150ms ease,
    opacity 150ms ease;

  &:hover {
    opacity: 1;
    color: var(--tsc-text);
    background: rgba(127, 127, 127, 0.16);
  }

  &:focus-visible {
    opacity: 1;
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
    background: transparent;
    color: var(--tsc-text-subtle);
  }
`;

export const SegmentedGroup = styled.div`
  display: flex;
  width: 100%;
  gap: 2px;
  padding: 3px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.16);
  background: ${({ theme }) =>
    theme.mode === "dark" ? "rgba(0, 0, 0, 0.18)" : "rgba(127, 127, 127, 0.1)"};
`;

export const SegmentedOption = styled.button`
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: ${({ isActive, theme }) =>
    isActive
      ? theme.mode === "dark"
        ? "rgba(255, 255, 255, 0.09)"
        : "#ffffff"
      : "transparent"};
  color: ${({ isActive }) =>
    isActive ? "var(--tsc-text)" : "var(--tsc-text-subtle)"};
  font-size: 12px;
  line-height: 1.2;
  font-weight: ${({ isActive }) => (isActive ? 600 : 500)};
  cursor: pointer;
  box-shadow: ${({ isActive }) =>
    isActive ? "0 1px 3px rgba(0, 0, 0, 0.18)" : "none"};
  transition:
    background-color 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;

  &:hover {
    color: var(--tsc-text);
    background: ${({ isActive, theme }) =>
      isActive
        ? theme.mode === "dark"
          ? "rgba(255, 255, 255, 0.09)"
          : "#ffffff"
        : "rgba(127, 127, 127, 0.12)"};
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: -1px;
  }
`;

export const PrefRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 30px;
`;

export const PrefRowMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`;

export const Switch = styled.button`
  position: relative;
  flex-shrink: 0;
  width: 34px;
  height: 20px;
  margin-top: 2px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid
    ${({ checked }) =>
      checked ? "var(--tsc-brand)" : "rgba(127, 127, 127, 0.36)"};
  background: ${({ checked }) =>
    checked ? "var(--tsc-brand)" : "rgba(127, 127, 127, 0.24)"};
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease;

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: ${({ checked }) => (checked ? "16px" : "2px")};
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: left 150ms ease;
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }
`;

export const LightCloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--tsc-text-subtle);
  cursor: pointer;
  transition:
    color 150ms ease,
    border-color 150ms ease,
    background-color 150ms ease;

  &:hover {
    color: var(--tsc-text);
    border-color: var(--tsc-neutral-hovered);
    background: rgba(127, 127, 127, 0.14);
  }

  &:focus-visible {
    outline: 2px solid var(--tsc-brand);
    outline-offset: 1px;
  }
`;

export const FontControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const LinkHint = styled.a`
  color: var(--tsc-brand);
  font-size: 11px;
  line-height: 1.2;
  text-decoration: none;

  &:hover {
    color: var(--tsc-brand-hovered);
    text-decoration: underline;
  }
`;
