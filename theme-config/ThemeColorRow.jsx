import { useRef, useState } from "react";
import PropTypes from "prop-types";

import ColorPicker from "./ColorPicker";

import * as S from "./styled";

const HEX_COLOR_RE = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;
const HEX_INPUT_RE = /^#?([0-9a-f]{6})$/i;

const parseHexColor = (value) => {
  const match = HEX_COLOR_RE.exec(value ?? "");
  if (!match) {
    return null;
  }
  return { hex6: match[1], alphaByteRaw: match[2] ?? null };
};

const getAlphaPercent = (alphaByteRaw) =>
  alphaByteRaw == null
    ? 100
    : Math.round((parseInt(alphaByteRaw, 16) / 255) * 100);

// 100% keeps the 6-digit convention used by the built-in themes; anything
// lower appends the alpha byte (8-digit hex).
const composeAlpha = (hex6, alphaPercent) => {
  const hex6Upper = hex6.toUpperCase();
  if (alphaPercent >= 100) {
    return `#${hex6Upper}`;
  }
  const alphaByte = Math.round((alphaPercent / 100) * 255)
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");
  return `#${hex6Upper}${alphaByte}`;
};

function ThemeColorRow({ label, value, onChange }) {
  const parsed = parseHexColor(value);
  const [hexDraft, setHexDraft] = useState(null);
  const [alphaDraft, setAlphaDraft] = useState(null);
  const skipBlurCommitRef = useRef(false);

  const displayHex =
    hexDraft ?? (parsed ? parsed.hex6.toUpperCase() : (value ?? ""));
  const displayAlpha =
    alphaDraft ?? (parsed ? String(getAlphaPercent(parsed.alphaByteRaw)) : "");

  const commitHex = () => {
    if (hexDraft == null) {
      return;
    }
    const match = HEX_INPUT_RE.exec(hexDraft.trim());
    setHexDraft(null);
    if (!match) {
      return;
    }
    const hex6 = match[1].toUpperCase();
    const tail = parsed?.alphaByteRaw ?? "";
    const nextValue = `#${hex6}${tail}`;
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  const commitAlpha = () => {
    if (alphaDraft == null || !parsed) {
      return;
    }
    const parsedPercent = Number(alphaDraft.trim());
    setAlphaDraft(null);
    if (!Number.isFinite(parsedPercent)) {
      return;
    }
    const alphaPercent = Math.min(100, Math.max(0, Math.round(parsedPercent)));
    if (alphaPercent === getAlphaPercent(parsed.alphaByteRaw)) {
      return;
    }
    const nextValue = composeAlpha(parsed.hex6, alphaPercent);
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  const handleBlur = (commit) => () => {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }
    commit();
  };

  const handleCommitKeys = (ev, commit, cancel) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      commit();
      skipBlurCommitRef.current = true;
      ev.target.blur();
    }
    if (ev.key === "Escape") {
      cancel();
      skipBlurCommitRef.current = true;
      ev.target.blur();
    }
  };

  return (
    <S.ColorRow>
      <ColorPicker
        color={value}
        renderTrigger={(toggleDropdown) => (
          <S.ColorSwatchButton
            type="button"
            color={value}
            aria-label={`Pick ${label} color`}
            title={value}
            onClick={toggleDropdown}
          />
        )}
        setColor={onChange}
      />
      <S.ColorRowLabel title={label}>{label}</S.ColorRowLabel>
      <S.HexInput
        value={displayHex}
        aria-label={`${label} hex value`}
        spellCheck={false}
        onFocus={() => setHexDraft(displayHex)}
        onChange={(ev) => setHexDraft(ev.target.value)}
        onBlur={handleBlur(commitHex)}
        onKeyDown={(ev) =>
          handleCommitKeys(ev, commitHex, () => setHexDraft(null))
        }
      />
      {parsed && (
        <S.AlphaInputWrap>
          <S.AlphaInput
            value={displayAlpha}
            inputMode="numeric"
            aria-label={`${label} opacity percent`}
            onFocus={() => setAlphaDraft(displayAlpha)}
            onChange={(ev) => setAlphaDraft(ev.target.value)}
            onBlur={handleBlur(commitAlpha)}
            onKeyDown={(ev) =>
              handleCommitKeys(ev, commitAlpha, () => setAlphaDraft(null))
            }
          />
          <S.InputSuffix>%</S.InputSuffix>
        </S.AlphaInputWrap>
      )}
    </S.ColorRow>
  );
}

ThemeColorRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default ThemeColorRow;
