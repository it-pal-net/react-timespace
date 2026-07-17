import styled from "@emotion/styled";
import { css } from "@emotion/react";

import { timelineNowGlow, timelineNowPulse } from "./animations";
import { zIndexFloors } from "../constants";

const timelineNowLineStyles = css`
  &.timeline-now-line {
    box-shadow:
      0 0 0 1px rgba(120, 200, 255, 0.18),
      0 0 10px rgba(120, 200, 255, 0.06);
    animation: ${timelineNowGlow} 2.4s ease-in-out infinite;
    animation-play-state: running;
    will-change: opacity, filter;
  }

  &.timeline-now-line::after {
    content: "";
    position: absolute;
    pointer-events: none;
    left: -4px;
    right: -4px;
    top: -10px;
    bottom: -10px;
    border-radius: 999px;
    background: radial-gradient(
      closest-side,
      rgba(120, 200, 255, 0.22),
      rgba(120, 200, 255, 0) 70%
    );
    opacity: 0.06;
    animation: ${timelineNowPulse} 3.8s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &.timeline-now-line {
      animation: none;
      opacity: 1;
      filter: brightness(1.04) drop-shadow(0 0 12px rgba(120, 200, 255, 0.22));
    }
    &.timeline-now-line::after {
      animation: none;
      opacity: 0.06;
    }
  }
`;

export const TimePoint = styled.div`
  display: block;
`;

export const TimePointBody = styled.div`
  position: fixed;
  width: ${({ theme }) => theme.uiScale * theme.size.clockHand}px;
  background-color: var(--clockHandBody);

  ${timelineNowLineStyles}
`;

export const TimePointTail = styled.div`
  position: fixed;
  width: ${({ theme }) => theme.uiScale * theme.size.clockHand}px;
  background-color: var(--clockHandTail);

  ${timelineNowLineStyles}
`;

export const TimePointLabel = styled.div`
  position: absolute;
  border-radius: 4px;
  color: var(--text);
`;

export const IntervalHitStrip = styled.div`
  position: absolute;
  z-index: ${zIndexFloors.head};
  cursor: ew-resize;
  touch-action: none;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: rgba(120, 200, 255, 0);
    transition: background 120ms ease;
    pointer-events: none;
  }

  &:hover::after {
    background: rgba(120, 200, 255, 0.12);
  }

  &:active::after {
    background: rgba(120, 200, 255, 0.2);
  }

  &:hover ~ .interval-marker-piece {
    filter: brightness(1.25);
  }
`;
