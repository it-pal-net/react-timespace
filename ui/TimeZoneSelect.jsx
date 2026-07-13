import PropTypes from "prop-types";

import tzOptions from "../tzOptions";

// Fallback place selector used when the host app doesn't provide
// `renderPlaceSelector`: a plain native select over the bundled IANA zones.
const TimeZoneSelect = ({ height, onSelect, onBlur }) => (
  <select
    autoFocus
    defaultValue=""
    style={{
      height,
      width: "100%",
      background: "transparent",
      color: "inherit",
      font: "inherit",
      border: "1px solid var(--border, rgba(128, 128, 128, 0.4))",
      borderRadius: "4px",
    }}
    onChange={(ev) => {
      const option = tzOptions.find((o) => o.value === ev.target.value);
      if (option) {
        onSelect(option);
      }
    }}
    onBlur={onBlur}
  >
    <option value="" disabled>
      Select time zone…
    </option>
    {tzOptions.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

TimeZoneSelect.propTypes = {
  height: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
};

export default TimeZoneSelect;
