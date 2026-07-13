import styled from "@emotion/styled";

export const Clock = styled.div`
  color: ${({ color }) => color ?? "var(--timeline-text, var(--text))"};
`;

export const EditModeActionsArea = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
`;

export const EditModeActions = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
`;

export const TimespaceName = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
`;

export const AddressbookTopRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 32px;
  gap: 12px;
  width: 100%;
`;

export const AddressbookIdentityGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  flex-shrink: 0;
`;

export const ViewPurposeHint = styled.div`
  font-size: 0.73rem;
  color: var(--text-subtle);
  opacity: 0.86;
  white-space: nowrap;
  line-height: 1.2;
`;

export const AddressbookBreadcrumb = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 500;
  color: var(--text-subtle);
  opacity: 0.8;
  white-space: nowrap;
`;

export const BreadcrumbSeparator = styled.span`
  opacity: 0.7;
`;

export const TabSeparator = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 1.2em;
  font-weight: 600;

  color: var(--text);

  width: 1.4px;
  height: 1.4em;
  background-color: var(--background-neutral-hovered);
`;

export const Switch = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 0 2px;
  min-height: var(--subheader-control-h);
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
`;

export const SwitchButton = styled("button", {
  shouldForwardProp: (prop) => prop !== "isActive",
})`
  position: relative;
  appearance: none;
  border: none;
  background: transparent;
  color: ${({ isActive }) =>
    isActive ? "var(--text)" : "var(--text-subtle, rgba(67, 75, 86, 0.82))"};
  font-size: 0.82rem;
  font-weight: ${({ isActive }) => (isActive ? 650 : 500)};
  border-radius: 0;
  padding: 0 2px;
  cursor: pointer;
  line-height: 1.1;
  min-height: var(--subheader-control-h);
  transition:
    color 0.2s ease,
    opacity 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    border-radius: 0;
    background: currentColor;
    opacity: ${({ isActive }) => (isActive ? 1 : 0)};
    transform: scaleX(${({ isActive }) => (isActive ? 1 : 0.85)});
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  &:hover {
    color: var(--text);
  }
`;

export const SwitchButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const SwitchIcon = styled("span", {
  shouldForwardProp: (prop) => prop !== "isActive",
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  opacity: ${({ isActive }) => (isActive ? 0.95 : 0.68)};
  color: currentColor;
  transform: translateY(-0.5px);
`;

export const SwitchBadge = styled.span`
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  padding: 0 5px;
  background: var(--accent, #3b82f6);
  color: var(--text-on-accent, #fff);
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
`;
