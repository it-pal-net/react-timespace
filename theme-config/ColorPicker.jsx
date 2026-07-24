import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { HexColorPicker } from "react-colorful";

import useDebounce from "../hooks/useDebounce";
import * as S from "./styled";

const POPOVER_GAP = 8;
const POPOVER_SIZE = 216; // react-colorful default 200px + popover padding

function ColorPicker({ color = "#000000", setColor, renderTrigger }) {
  const triggerWrapRef = useRef(null);
  const popoverRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const [inputColor, setInputColor] = useState(color);

  const debouncedSetColor = useDebounce(setColor, 500);

  // Mirror external color changes (preset switch, hover preview, reset) into the
  // local swatch. This sync is passive — it must never feed back into setColor,
  // or hovering a preset to preview it would be committed to the theme draft as
  // a phantom "unsaved" edit.
  useEffect(() => {
    setInputColor(color);
  }, [color]);

  // Only an explicit pick from the wheel commits a color to the theme.
  const handlePickColor = (nextColor) => {
    setInputColor(nextColor);
    debouncedSetColor(nextColor);
  };

  useLayoutEffect(() => {
    if (!isOpen || !triggerWrapRef.current) {
      return;
    }
    const rect = triggerWrapRef.current.getBoundingClientRect();
    const left = Math.min(
      rect.right + POPOVER_GAP,
      window.innerWidth - POPOVER_SIZE - POPOVER_GAP,
    );
    const top = Math.min(
      rect.top,
      window.innerHeight - POPOVER_SIZE - POPOVER_GAP,
    );
    setPosition({
      left: Math.max(POPOVER_GAP, left),
      top: Math.max(POPOVER_GAP, top),
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (
        popoverRef.current?.contains(event.target) ||
        triggerWrapRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <>
      <span ref={triggerWrapRef} style={{ display: "inline-flex" }}>
        {renderTrigger(toggleOpen, { color: inputColor })}
      </span>
      {isOpen &&
        position &&
        createPortal(
          <S.ColorPickerPopover ref={popoverRef} style={position}>
            <HexColorPicker color={inputColor} onChange={handlePickColor} />
          </S.ColorPickerPopover>,
          document.body,
        )}
    </>
  );
}

ColorPicker.propTypes = {
  color: PropTypes.string,
  setColor: PropTypes.func.isRequired,
  renderTrigger: PropTypes.func.isRequired,
};

export default ColorPicker;
