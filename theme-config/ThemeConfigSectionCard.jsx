import PropTypes from "prop-types";
import { RotateCcw } from "lucide-react";

import * as S from "./styled";

function ThemeConfigSectionCard({ title, onReset, canReset = true, children }) {
  return (
    <S.CompactSectionCard>
      <S.SectionHeader>
        <S.SectionHeaderTitle>{title}</S.SectionHeaderTitle>
        {onReset && (
          <S.SectionHeaderActions>
            <S.IconActionButton
              type="button"
              aria-label={`Reset ${title} section`}
              title="Reset section"
              disabled={!canReset}
              onClick={onReset}
            >
              <RotateCcw size={13} />
            </S.IconActionButton>
          </S.SectionHeaderActions>
        )}
      </S.SectionHeader>
      <S.SectionContent>{children}</S.SectionContent>
    </S.CompactSectionCard>
  );
}

ThemeConfigSectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  onReset: PropTypes.func,
  canReset: PropTypes.bool,
  children: PropTypes.node,
};

export default ThemeConfigSectionCard;
