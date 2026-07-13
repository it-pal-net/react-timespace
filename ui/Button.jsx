import styled from "@emotion/styled";
import { css } from "@emotion/react";

// Minimal button covering only the variants Timespace uses; visually
// identical to the app Button for those variants.
const getAppearanceStyles = (props) => {
  if (props.appearance === "subtle-link") {
    return {
      color: "var(--text-subtle)",
      background: "none",
      hoverBackground: "none",
    };
  }
  return {};
};

const getSpacingStyles = (props) => {
  if (props.spacing === "none") {
    return {
      height: "auto",
      lineHeight: "inherit",
      padding: "0",
      verticalAlign: "baseline",
    };
  }
  return {};
};

const getButtonStyles = (props) => {
  const baseStyles = {
    display: "flex",
    cursor: "pointer",
    height: "32px",
    lineHeight: "32px",
    padding: "0 12px",
    verticalAlign: "middle",
    width: "auto",
    color: "inherit",
    background: "var(--background-neutral)",
    hoverBackground: "var(--background-neutral-hovered)",
    alignItems: props.withIcon ? "center" : "baseline",
    justifyContent: "center",
    borderRadius: "3px",
    borderWidth: "0",
    boxSizing: "border-box",
    fontSize: "inherit",
    fontStyle: "normal",
    fontWeight: "500",
    margin: "0",
    maxWidth: "100%",
    outline: "none !important",
    pointerEvents: "auto",
    textAlign: "center",
    textDecoration: "none",
    transition:
      "background 0.1s ease-out, box-shadow 0.15s cubic-bezier(0.47, 0.03, 0.49, 1.38)",
    transitionDuration: "0.1s, 0.15s",
    whiteSpace: "nowrap",
    boxShadow: "none",
    userSelect: "none",
  };

  return css({
    ...baseStyles,
    ...getAppearanceStyles(props),
    ...getSpacingStyles(props),
    "&::-moz-focus-inner": {
      border: 0,
      margin: 0,
      padding: 0,
    },
    "&:hover": {
      background: baseStyles.hoverBackground,
    },
    "&:active": {
      transitionDuration: "0s",
    },
    "&:focus": {
      outline: "none",
      transitionDuration: "0s, 0.2s",
    },
  });
};

const StyledButton = styled.button`
  ${getButtonStyles};
`;

const Button = (props) => <StyledButton type="button" {...props} />;

export default Button;
