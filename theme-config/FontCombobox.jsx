import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";

import fontPresets from "../fontPresets";

import * as S from "./styled";

const getFontFamily = (fontValue) => (fontValue ?? "").split(":")[0];

// Free-typed families follow the stored `family:wght@400` convention; a value
// that already carries an axis spec (contains ":") is passed through verbatim.
const serializeFontInput = (rawInput) => {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes(":")) {
    return trimmed;
  }
  const preset = fontPresets.find(
    (fontItem) =>
      getFontFamily(fontItem.value).toLowerCase() === trimmed.toLowerCase(),
  );
  if (preset) {
    return preset.value;
  }
  return `${trimmed}:wght@400`;
};

function FontCombobox({
  font,
  onSetThemeFont,
  onPreviewFont,
  onClearPreviewFont,
}) {
  const currentFamily = getFontFamily(font);
  const [inputValue, setInputValue] = useState(currentFamily);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isEditing, setIsEditing] = useState(false);
  const wrapRef = useRef(null);
  const skipBlurCommitRef = useRef(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(currentFamily);
    }
  }, [currentFamily, isEditing]);

  const filteredPresets = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query || query === currentFamily.toLowerCase()) {
      return fontPresets;
    }
    return fontPresets.filter((fontItem) =>
      getFontFamily(fontItem.value).toLowerCase().includes(query),
    );
  }, [inputValue, currentFamily]);

  const close = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    onClearPreviewFont();
  };

  const commitFontValue = (nextFont) => {
    if (nextFont && nextFont !== font) {
      onSetThemeFont(nextFont);
    }
    setIsEditing(false);
    close();
  };

  const commitTyped = () => {
    const serialized = serializeFontInput(inputValue);
    if (!serialized) {
      setIsEditing(false);
      setInputValue(currentFamily);
      close();
      return;
    }
    commitFontValue(serialized);
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

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <S.ComboboxWrap ref={wrapRef}>
      <S.ComboboxInput
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-label="Font family"
        placeholder="e.g. Inter, Roboto, Montserrat"
        value={inputValue}
        onFocus={() => {
          setIsEditing(true);
          setIsOpen(true);
        }}
        onChange={(ev) => {
          setInputValue(ev.target.value);
          setIsEditing(true);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={(ev) => {
          if (ev.key === "ArrowDown") {
            ev.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((prev) =>
              Math.min(prev + 1, filteredPresets.length - 1),
            );
          }
          if (ev.key === "ArrowUp") {
            ev.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, -1));
          }
          if (ev.key === "Enter") {
            ev.preventDefault();
            if (
              isOpen &&
              highlightedIndex >= 0 &&
              filteredPresets[highlightedIndex]
            ) {
              commitFontValue(filteredPresets[highlightedIndex].value);
            } else {
              commitTyped();
            }
            skipBlurCommitRef.current = true;
            ev.target.blur();
          }
          if (ev.key === "Escape") {
            setIsEditing(false);
            setInputValue(currentFamily);
            close();
            skipBlurCommitRef.current = true;
            ev.target.blur();
          }
        }}
        onBlur={() => {
          if (skipBlurCommitRef.current) {
            skipBlurCommitRef.current = false;
            return;
          }
          commitTyped();
        }}
      />
      <S.ComboboxToggle
        type="button"
        tabIndex={-1}
        aria-label={isOpen ? "Close font list" : "Open font list"}
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={() => {
          if (isOpen) {
            close();
          } else {
            setIsOpen(true);
          }
        }}
      >
        <ChevronDown size={15} />
      </S.ComboboxToggle>
      {isOpen && filteredPresets.length > 0 && (
        <S.ComboboxList role="listbox" onMouseLeave={onClearPreviewFont}>
          {filteredPresets.map((fontItem, index) => {
            const family = getFontFamily(fontItem.value);
            return (
              <S.ComboboxOption
                key={fontItem.value}
                type="button"
                role="option"
                aria-selected={fontItem.value === font}
                isHighlighted={index === highlightedIndex}
                onMouseDown={(ev) => ev.preventDefault()}
                onMouseEnter={() => {
                  setHighlightedIndex(index);
                  onPreviewFont(fontItem.value);
                }}
                onClick={() => commitFontValue(fontItem.value)}
              >
                {family}
                {fontItem.value === font && (
                  <S.ComboboxOptionMeta>current</S.ComboboxOptionMeta>
                )}
              </S.ComboboxOption>
            );
          })}
        </S.ComboboxList>
      )}
    </S.ComboboxWrap>
  );
}

FontCombobox.propTypes = {
  font: PropTypes.string,
  onSetThemeFont: PropTypes.func.isRequired,
  onPreviewFont: PropTypes.func.isRequired,
  onClearPreviewFont: PropTypes.func.isRequired,
};

export default FontCombobox;
