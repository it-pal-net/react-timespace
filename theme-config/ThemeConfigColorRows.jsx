import PropTypes from "prop-types";

import { useThemeConfigContext } from "./configContext";
import ThemeColorRow from "./ThemeColorRow";

import * as S from "./styled";

function ThemeConfigColorRows({ colorKeys, theme, onSetThemeColor }) {
  const { colorLabels } = useThemeConfigContext();

  return (
    <S.CompactColorGrid>
      {colorKeys.map((colorVar) => (
        <ThemeColorRow
          key={colorVar}
          label={colorLabels[colorVar] ?? colorVar}
          value={theme.color[colorVar]}
          onChange={(color) => onSetThemeColor(colorVar, color)}
        />
      ))}
    </S.CompactColorGrid>
  );
}

ThemeConfigColorRows.propTypes = {
  colorKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  theme: PropTypes.object.isRequired,
  onSetThemeColor: PropTypes.func.isRequired,
};

export default ThemeConfigColorRows;
