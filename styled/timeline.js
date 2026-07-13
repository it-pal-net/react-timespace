import styled from "@emotion/styled";
import { css } from "@emotion/react";

import { timelineHomeNowCellPulse } from "./animations";

export const TimeLineStory = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--background-surface);
  height: 80vh;
  padding-top: 10vh;
  padding-bottom: 10vh;

  background-image: url(https://trello.com/assets/941e9fef7b1b1129b904.svg);
  background-blend-mode: soft-light;
  background-color: #0000004d !important;
`;

export const TimeLineList = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  overflow-x: hidden;
  height: 100%;
  width: 100%;

  .dragging {
    /* Actual opacity is controlled dynamically during drag to create a
       "fade-out as you overlap the target slot" effect. */
    opacity: 1;
  }
  .over {
    opacity: 0.6;
  }

  @keyframes timelineDropFlash {
    0% {
      box-shadow: 0 0 0 0px rgba(120, 200, 255, 0);
      background-color: rgba(120, 200, 255, 0);
    }
    20% {
      box-shadow: 0 0 0 2px rgba(120, 200, 255, 0.22);
      background-color: rgba(120, 200, 255, 0.06);
    }
    100% {
      box-shadow: 0 0 0 0px rgba(120, 200, 255, 0);
      background-color: rgba(120, 200, 255, 0);
    }
  }

  .dnd-drop-flash {
    animation: timelineDropFlash 650ms cubic-bezier(0.2, 0.8, 0.2, 1);
    border-radius: 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    .dnd-drop-flash {
      animation: none;
      box-shadow: 0 0 0 2px rgba(120, 200, 255, 0.14);
      background-color: rgba(120, 200, 255, 0.04);
    }
  }

  .timeline-drag-handle {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 12px;
    cursor: grab;
    z-index: 5;
    background: transparent;
  }

  .timeline-drag-handle::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 6px;
    width: 44px;
    height: 4px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: repeating-linear-gradient(
      90deg,
      rgba(120, 200, 255, 0) 0px,
      rgba(120, 200, 255, 0) 3px,
      rgba(120, 200, 255, 0.22) 3px,
      rgba(120, 200, 255, 0.22) 5px,
      rgba(120, 200, 255, 0) 5px,
      rgba(120, 200, 255, 0) 8px
    );
    opacity: 0;
    transition:
      opacity 140ms ease,
      filter 140ms ease;
  }

  .time-line-item:hover .timeline-drag-handle::before,
  .timeline-drag-handle:hover::before {
    opacity: 1;
    filter: drop-shadow(0 0 3px rgba(120, 200, 255, 0.18));
  }

  .timeline-drag-handle:active {
    cursor: grabbing;
  }
`;

export const TimeLineItem = styled.div`
  display: flex;
  flex-direction: column;
  user-select: none;
  position: relative;
  background: transparent;

  -webkit-user-drag: element;

  &::before {
    content: "";
    position: absolute;
    left: 28px;
    right: 28px;
    top: 0;
    bottom: 0;
    border-radius: 0;
    pointer-events: none;
    background: ${({ theme }) =>
      theme.mode === "dark"
        ? "rgba(6, 10, 16, 0.16)"
        : "rgba(255, 255, 255, 0.2)"};
    backdrop-filter: blur(9px);
    -webkit-backdrop-filter: blur(9px);
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &:first-of-type::before {
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    box-shadow: 0 -12px 28px rgba(0, 0, 0, 0.22);
  }

  &:last-of-type::before {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
  }

  &:first-of-type {
    margin-top: auto;
  }
  &:last-of-type {
    margin-bottom: auto;
  }
`;

export const TimeLine = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  box-sizing: border-box;
  padding-left: 56px;
  padding-right: 56px;
`;

export const TimeLineHeader = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  font-size: ${({ theme }) => theme.uiScale * 150}%;
  color: var(--text);
`;

export const TimeLineHeaderContent = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

export const TimeLineName = styled.span`
  cursor: pointer;
  color: var(--timeline-text, var(--text));

  .home-indicator {
    opacity: 0.55;
    font-size: 0.85em;
  }
`;

export const Hours = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  max-width: 2400px;
`;

export const Hour = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 28px;
  width: 100%;
  color: var(--timeline-text, var(--text));
  justify-content: center;
  max-width: ${({ maxWidth }) => maxWidth}px;
  min-width: 28px;
  height: ${({ theme }) => theme.uiScale * 2}rem;
  align-items: center;
  border: ${({ isEmpty, theme }) =>
    isEmpty
      ? "none"
      : `${theme.size.borderHour * theme.uiScale}px solid ${
          theme.mode === "dark"
            ? "rgba(255, 255, 255, 0.07)"
            : "rgba(17, 24, 39, 0.08)"
        }`};
  border-left: none;
  font-size: ${({ theme }) => theme.uiScale * 150}%;
  position: relative;
  background-color: ${({ period }) => {
    switch (period) {
      case "night":
        return "rgba(0, 0, 0, 0.04)";
      case "morning":
      case "evening":
        return "rgba(120, 200, 255, 0.008)";
      default:
        return "transparent";
    }
  }};
  background-image: ${({
    isEmpty,
    isWeekend,
    isNowCol,
    isPast,
    isHomeNowCell,
  }) => {
    if (isEmpty) return "none";
    const layers = [];
    if (isHomeNowCell) {
      layers.push(
        "linear-gradient(rgba(120, 200, 255, 0.05), rgba(120, 200, 255, 0.05))",
      );
    }
    if (isNowCol) {
      layers.push(
        "linear-gradient(rgba(100, 140, 255, 0.02), rgba(100, 140, 255, 0.02))",
      );
    }
    if (isPast) {
      layers.push("linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02))");
    }
    if (isWeekend) {
      layers.push(
        "linear-gradient(rgba(160, 180, 255, 0.006), rgba(160, 180, 255, 0.006))",
      );
    }
    return layers.length ? layers.join(", ") : "none";
  }};

  outline: ${({ isHomeNowCell }) =>
    isHomeNowCell ? "2px solid rgba(120, 200, 255, 0.35)" : "none"};
  outline-offset: ${({ isHomeNowCell }) => (isHomeNowCell ? "-2px" : "0")};
  border-radius: ${({ isHomeNowCell }) => (isHomeNowCell ? "4px" : "0")};

  .hour-label {
    opacity: ${({ isQuietHour, isPast }) => {
      const base = isQuietHour ? 0.45 : 1;
      return isPast ? base * 0.58 : base;
    }};
  }

  ${({ isHomeNowCell }) =>
    isHomeNowCell &&
    css`
      .hour-label {
        opacity: 1;
        font-weight: 600;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
      }

      animation: ${timelineHomeNowCellPulse} 2.6s ease-in-out infinite;
      will-change: box-shadow, filter;
    `}

  ${({ isEmpty, isDayStart }) =>
    !isEmpty &&
    isDayStart &&
    `
      box-shadow:
        inset 1px 0 0 rgba(100, 140, 255, 0.16),
        inset 2px 0 0 rgba(100, 140, 255, 0.04);
    `}

  &:first-of-type {
    border-left: ${({ isEmpty, theme }) =>
      isEmpty
        ? "none"
        : `${theme.size.borderHour * theme.uiScale}px solid ${
            theme.mode === "dark"
              ? "rgba(255, 255, 255, 0.07)"
              : "rgba(17, 24, 39, 0.08)"
          }`};
  }

  @media (prefers-reduced-motion: reduce) {
    ${({ isHomeNowCell }) =>
      isHomeNowCell &&
      css`
        animation: none;
        filter: brightness(1.04);
      `}
  }
`;
