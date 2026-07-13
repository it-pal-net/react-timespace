import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";

const sizes = {
  tiny: [12, 12],
  small: [16, 16],
  smallX: [18, 18],
  smallXL: [20, 20],
  middle: [24, 24],
  large: [32, 32],
  huge: [64, 64],
};

const iconPropTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  shouldPadding: PropTypes.bool,
  applyUiScale: PropTypes.bool,
  style: PropTypes.object,
};

const useSvgProps = ({ size, shouldPadding, applyUiScale, style, rest }) => {
  const theme = useTheme();
  const sizePoints = typeof size === "string" ? sizes[size] : size;
  const [width, height] = sizePoints;
  const uiScale = theme.uiScale ?? 1;

  return {
    width: applyUiScale ? width * uiScale : width,
    height: applyUiScale ? height * uiScale : height,
    style: Object.assign(shouldPadding ? { padding: "4px" } : {}, style),
    ...rest,
  };
};

export const CrossIcon = ({
  size = "middle",
  shouldPadding = false,
  applyUiScale = true,
  style = {},
  ...rest
}) => {
  const svgProps = useSvgProps({
    size,
    shouldPadding,
    applyUiScale,
    style,
    rest,
  });

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...svgProps}>
      <path
        fill="currentColor"
        d="M12 10.586L6.707 5.293a1 1 0 00-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 001.414 1.414L12 13.414l5.293 5.293a1 1 0 001.414-1.414L13.414 12l5.293-5.293a1 1 0 10-1.414-1.414L12 10.586z"
      />
    </svg>
  );
};
CrossIcon.propTypes = iconPropTypes;

export const AddCalendarEventIcon = ({
  size = "middle",
  shouldPadding = false,
  applyUiScale = true,
  style = {},
  ...rest
}) => {
  const svgProps = useSvgProps({
    size,
    shouldPadding,
    applyUiScale,
    style,
    rest,
  });

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2048 2048"
      {...svgProps}
    >
      <path
        fill="currentColor"
        d="M1664 128h384v1792H0V128h384V0h128v128h1024V0h128v128zM384 256H128v256h1792V256h-256v128h-128V256H512v128H384V256zM128 1792h1792V640H128v1152zm960-1024v384h384v128h-384v384H960v-384H576v-128h384V768h128z"
      />
    </svg>
  );
};
AddCalendarEventIcon.propTypes = iconPropTypes;

export const UserIcon = ({
  size = "middle",
  shouldPadding = false,
  applyUiScale = true,
  style = {},
  ...rest
}) => {
  const svgProps = useSvgProps({
    size,
    shouldPadding,
    applyUiScale,
    style,
    rest,
  });

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...svgProps}>
      <path
        fill="currentColor"
        d="M12 12.5c2.9 0 5.25-2.35 5.25-5.25S14.9 2 12 2 6.75 4.35 6.75 7.25 9.1 12.5 12 12.5Zm0-8.5a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Z"
      />
      <path
        fill="currentColor"
        d="M12 14c-4.56 0-8.25 3.13-8.25 7a1 1 0 1 0 2 0c0-2.55 2.8-5 6.25-5s6.25 2.45 6.25 5a1 1 0 1 0 2 0c0-3.87-3.69-7-8.25-7Z"
      />
    </svg>
  );
};
UserIcon.propTypes = iconPropTypes;
