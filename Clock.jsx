import { useMemo, useContext } from "react";
import PropTypes from "prop-types";

import { TimeZonesContext } from "./state/timeZonesProvider";

import * as S from "./styled";

function getTimeZoneOffsetSeconds(timeZone, date) {
  const formatterOffset = new Intl.DateTimeFormat("en-US", {
    hourCycle: "h23",
    timeZoneName: "longOffset",
    timeZone,
  });
  const partsOffset = formatterOffset
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName");
  const offsetMatch = partsOffset?.value?.match(
    /(?:GMT|UTC)([+-]\\d{2}):(\\d{2})/,
  );
  if (!offsetMatch) return 0;
  const offsetHours = parseInt(offsetMatch[1], 10);
  const offsetMinutes = parseInt(offsetMatch[2], 10);
  return offsetHours * 3600 + offsetMinutes * 60;
}

const Clock = ({ color, timeZone, dayOffsetSeconds = 0 }) => {
  const { tzState } = useContext(TimeZonesContext);

  const timeStr = useMemo(() => {
    const now = new Date();
    const localTimeZoneOffsetSeconds = getTimeZoneOffsetSeconds(
      tzState.localZone,
      now,
    );
    const homeTimeZoneOffsetSeconds = getTimeZoneOffsetSeconds(
      tzState.homeZone,
      now,
    );
    const offsetDifference =
      homeTimeZoneOffsetSeconds - localTimeZoneOffsetSeconds;

    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      // second: "2-digit",
      hour12: false,
      timeZone,
    });

    const startOfThisDay = new Date(now);
    startOfThisDay.setHours(0, 0, 0, 0);

    const dateToDisplay = new Date(
      startOfThisDay.getTime() +
        dayOffsetSeconds * 1000 -
        offsetDifference * 1000,
    );
    const hoursMinutes = formatter.format(dateToDisplay).replace(/^24/, "00");

    return hoursMinutes;
  }, [dayOffsetSeconds, timeZone, tzState.homeZone, tzState.localZone]);

  return <S.Clock color={color}>{timeStr}</S.Clock>;
};

Clock.propTypes = {
  timeZone: PropTypes.string.isRequired,
  dayOffsetSeconds: PropTypes.number,
  color: PropTypes.string,
};

export default Clock;
