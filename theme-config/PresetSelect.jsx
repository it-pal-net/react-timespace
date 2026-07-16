import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";

import * as S from "./styled";

// Default preset dropdown used when the host app does not inject its own
// Select. Implements the subset of the react-select contract the preset
// toolbar relies on: grouped options, formatOptionLabel and hover preview.
function PresetSelect({
  options = [],
  value,
  placeholder,
  formatOptionLabel,
  onChange,
  onOptionHover,
  onMenuMouseLeave,
  onMenuClose,
}) {
  const wrapRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
    onMenuClose?.();
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        close();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const renderOptionLabel = (option, context) =>
    formatOptionLabel ? formatOptionLabel(option, { context }) : option.label;

  return (
    <S.ComboboxWrap ref={wrapRef}>
      <S.SelectControl
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
      >
        <S.SelectControlValue>
          {value
            ? renderOptionLabel(value, "value")
            : (placeholder ?? "Select…")}
        </S.SelectControlValue>
        <ChevronDown size={16} />
      </S.SelectControl>
      {isOpen && (
        <S.ComboboxList role="listbox" onMouseLeave={onMenuMouseLeave}>
          {options.map((group) => (
            <div key={group.label}>
              <S.SelectGroupHeading>{group.label}</S.SelectGroupHeading>
              {group.options.map((option) => (
                <S.ComboboxOption
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value?.value}
                  isHighlighted={option.value === value?.value}
                  onMouseEnter={() => onOptionHover?.(option)}
                  onClick={() => {
                    onChange?.(option);
                    close();
                  }}
                >
                  {renderOptionLabel(option, "menu")}
                </S.ComboboxOption>
              ))}
            </div>
          ))}
        </S.ComboboxList>
      )}
    </S.ComboboxWrap>
  );
}

PresetSelect.propTypes = {
  options: PropTypes.array,
  value: PropTypes.object,
  placeholder: PropTypes.string,
  formatOptionLabel: PropTypes.func,
  onChange: PropTypes.func,
  onOptionHover: PropTypes.func,
  onMenuMouseLeave: PropTypes.func,
  onMenuClose: PropTypes.func,
};

export default PresetSelect;
