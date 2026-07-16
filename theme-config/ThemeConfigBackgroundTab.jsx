import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Image as ImageIcon, X } from "lucide-react";

import { useThemeConfigContext } from "./configContext";
import ThemeColorRow from "./ThemeColorRow";
import ThemeConfigSectionCard from "./ThemeConfigSectionCard";

import * as S from "./styled";

const EMPTY_STATE_IMAGE_HINTS = [
  "https://images.unsplash.com/photo-1608178398319-48f814d0750c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1502318217862-aa4e294ba657?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2MDMzOTR8MHwxfHNlYXJjaHwxNXx8c3BhY2V8ZW58MHx8fHwxNzczODE2MTI0fDA&ixlib=rb-4.1.0&q=80&w=400",
  "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
];

const FILL_MODE_LABELS = {
  color: "Solid",
  gradient: "Gradient",
  image: "Image",
};

function ThemeConfigBackgroundTab({ state, actions }) {
  const { components } = useThemeConfigContext();
  const GradientPicker = components.GradientPicker;
  const ImagePicker = components.ImagePicker;

  // Gradient and image fills need host-provided pickers; standalone use only
  // offers a solid color.
  const availableFillModes = [
    "color",
    ...(GradientPicker ? ["gradient"] : []),
    ...(ImagePicker ? ["image"] : []),
  ];

  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const selectedImage = state.theme.background?.image ?? "";

  // Which fill picker is on screen is UI-only state — switching it must NOT
  // touch the theme. The background changes only when a concrete color,
  // gradient, or image is picked (each picker commits its own type). We seed
  // from the applied type and re-sync whenever it changes externally (preset
  // switch, discard, or a concrete pick).
  const appliedFillMode = state.theme.background?.type || "color";
  const [fillMode, setFillMode] = useState(appliedFillMode);

  useEffect(() => {
    setFillMode(appliedFillMode);
  }, [appliedFillMode]);

  useEffect(() => {
    if (!isImagePickerOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsImagePickerOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isImagePickerOpen]);

  const effectiveFillMode = availableFillModes.includes(fillMode)
    ? fillMode
    : "color";

  return (
    <>
      <ThemeConfigSectionCard
        title="Fill"
        onReset={actions.onResetBackground}
        canReset={state.hasBackgroundChanges}
      >
        {availableFillModes.length > 1 && (
          <S.SegmentedGroup role="radiogroup" aria-label="Background fill">
            {availableFillModes.map((mode) => (
              <S.SegmentedOption
                key={mode}
                type="button"
                role="radio"
                aria-checked={effectiveFillMode === mode}
                isActive={effectiveFillMode === mode}
                onClick={() => setFillMode(mode)}
              >
                {FILL_MODE_LABELS[mode]}
              </S.SegmentedOption>
            ))}
          </S.SegmentedGroup>
        )}

        {effectiveFillMode === "color" && (
          <ThemeColorRow
            label="Color"
            value={state.theme.background?.color ?? "transparent"}
            onChange={actions.onSetBackgroundColor}
          />
        )}

        {effectiveFillMode === "gradient" && GradientPicker && (
          <GradientPicker />
        )}

        {effectiveFillMode === "image" && ImagePicker && (
          <S.CompactControl>
            <S.BackgroundPreviewCard
              type="button"
              aria-label="Browse background images"
              aria-haspopup="dialog"
              aria-expanded={isImagePickerOpen}
              onClick={() => setIsImagePickerOpen(true)}
            >
              <S.BackgroundPreviewFrame
                isSelected={Boolean(selectedImage)}
                hasImage={Boolean(selectedImage)}
              >
                {selectedImage ? (
                  <S.BackgroundPreviewImage
                    src={selectedImage}
                    alt="Selected background"
                  />
                ) : (
                  <S.BackgroundPreviewPlaceholder>
                    <S.BackgroundPreviewCollage aria-hidden="true">
                      <S.BackgroundPreviewThumb
                        imageUrl={EMPTY_STATE_IMAGE_HINTS[0]}
                      />
                      <S.BackgroundPreviewThumb
                        imageUrl={EMPTY_STATE_IMAGE_HINTS[1]}
                      />
                      <S.BackgroundPreviewThumb
                        imageUrl={EMPTY_STATE_IMAGE_HINTS[2]}
                      />
                      <S.BackgroundPreviewThumb
                        imageUrl={EMPTY_STATE_IMAGE_HINTS[3]}
                      />
                    </S.BackgroundPreviewCollage>
                    <S.BackgroundPreviewPlaceholderText>
                      Choose background image
                    </S.BackgroundPreviewPlaceholderText>
                  </S.BackgroundPreviewPlaceholder>
                )}
                {selectedImage && (
                  <S.BackgroundPreviewBadge>Selected</S.BackgroundPreviewBadge>
                )}
                <S.BackgroundPreviewHoverOverlay>
                  {selectedImage ? "Change image" : "Browse images"}
                </S.BackgroundPreviewHoverOverlay>
              </S.BackgroundPreviewFrame>
            </S.BackgroundPreviewCard>

            <S.BackgroundPickerAction
              type="button"
              onClick={() => setIsImagePickerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isImagePickerOpen}
            >
              <ImageIcon size={14} />
              Browse images
            </S.BackgroundPickerAction>
          </S.CompactControl>
        )}
      </ThemeConfigSectionCard>

      {isImagePickerOpen && ImagePicker && (
        <S.BackgroundPickerOverlay
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsImagePickerOpen(false);
            }
          }}
        >
          <S.BackgroundPickerDialog
            role="dialog"
            aria-modal="true"
            aria-label="Choose background image"
          >
            <S.BackgroundPickerHeader>
              <S.BackgroundPickerHeaderCopy>
                <S.SectionHeaderTitle>
                  Choose background image
                </S.SectionHeaderTitle>
                <S.SecondaryText>
                  Browse wallpapers and pick one for the current appearance.
                </S.SecondaryText>
              </S.BackgroundPickerHeaderCopy>
              <S.LightCloseButton
                type="button"
                aria-label="Close image picker"
                onClick={() => setIsImagePickerOpen(false)}
              >
                <X size={14} />
              </S.LightCloseButton>
            </S.BackgroundPickerHeader>
            <S.BackgroundPickerBody>
              <ImagePicker />
            </S.BackgroundPickerBody>
          </S.BackgroundPickerDialog>
        </S.BackgroundPickerOverlay>
      )}
    </>
  );
}

ThemeConfigBackgroundTab.propTypes = {
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};

export default ThemeConfigBackgroundTab;
