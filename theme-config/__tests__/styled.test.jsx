import { renderToString } from "react-dom/server";
import { ThemeProvider } from "@emotion/react";
import { describe, expect, it } from "vitest";

import {
  BackgroundPreviewFrame,
  BackgroundPreviewHoverOverlay,
  SectionHeaderActions,
} from "../styled";

describe("theme configurator styles", () => {
  it("render without requiring an Emotion component-selector transform", () => {
    expect(() =>
      renderToString(
        <ThemeProvider theme={{ mode: "dark" }}>
          <SectionHeaderActions>Reset</SectionHeaderActions>
          <BackgroundPreviewFrame isSelected={false}>
            <BackgroundPreviewHoverOverlay>
              Browse
            </BackgroundPreviewHoverOverlay>
          </BackgroundPreviewFrame>
        </ThemeProvider>,
      ),
    ).not.toThrow();
  });
});
