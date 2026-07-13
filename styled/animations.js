import { keyframes } from "@emotion/react";

export const timelineNowPulse = keyframes`
  0%,
  100% {
    opacity: 0.06;
    transform: translateZ(0) scaleY(0.985);
    filter: blur(8px);
  }
  50% {
    opacity: 0.12;
    transform: translateZ(0) scaleY(1);
    filter: blur(10px);
  }
`;

export const timelineNowGlow = keyframes`
  0%,
  100% {
    opacity: 0.94;
    filter: brightness(1.02)
      drop-shadow(0 0 1px rgba(120, 200, 255, 0.12))
      drop-shadow(0 0 10px rgba(120, 200, 255, 0.18));
  }
  50% {
    opacity: 1;
    filter: brightness(1.08)
      drop-shadow(0 0 2px rgba(120, 200, 255, 0.28))
      drop-shadow(0 0 16px rgba(120, 200, 255, 0.32));
  }
`;

export const timelineHomeNowCellPulse = keyframes`
  0%,
  100% {
    box-shadow:
      inset 0 0 0 2px rgba(120, 200, 255, 0.28),
      0 0 0 0 rgba(120, 200, 255, 0.0),
      0 0 10px rgba(120, 200, 255, 0.08);
    filter: brightness(1.02);
  }
  50% {
    box-shadow:
      inset 0 0 0 2px rgba(120, 200, 255, 0.42),
      0 0 0 2px rgba(120, 200, 255, 0.12),
      0 0 16px rgba(120, 200, 255, 0.18);
    filter: brightness(1.08);
  }
`;
