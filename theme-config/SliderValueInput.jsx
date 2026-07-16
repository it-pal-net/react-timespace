import { useRef, useState } from "react";
import PropTypes from "prop-types";

import * as S from "./styled";

const formatValue = (value) => String(Math.round(Number(value) * 100) / 100);

function SliderValueInput({ value, unit, min, max, ariaLabel, onCommit }) {
  const [draft, setDraft] = useState(null);
  const skipBlurCommitRef = useRef(false);

  const displayValue = draft ?? formatValue(value);

  const commit = () => {
    if (draft == null) {
      return;
    }
    const parsed = Number(draft.trim());
    setDraft(null);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const next = Math.min(max, Math.max(min, Math.round(parsed)));
    if (next !== Number(value)) {
      onCommit(next);
    }
  };

  return (
    <S.SliderValueWrap>
      <S.SliderValueField
        value={displayValue}
        inputMode="numeric"
        aria-label={ariaLabel}
        onFocus={() => setDraft(displayValue)}
        onChange={(ev) => setDraft(ev.target.value)}
        onBlur={() => {
          if (skipBlurCommitRef.current) {
            skipBlurCommitRef.current = false;
            return;
          }
          commit();
        }}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            commit();
            skipBlurCommitRef.current = true;
            ev.target.blur();
          }
          if (ev.key === "Escape") {
            setDraft(null);
            skipBlurCommitRef.current = true;
            ev.target.blur();
          }
        }}
      />
      <S.InputSuffix>{unit}</S.InputSuffix>
    </S.SliderValueWrap>
  );
}

SliderValueInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  onCommit: PropTypes.func.isRequired,
};

export default SliderValueInput;
