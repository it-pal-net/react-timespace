import { useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@emotion/react";
import PropTypes from "prop-types";

import {
  Timespace,
  TimespaceProvider,
  TimeZonesContext,
  setTimelines,
  addTimeline,
  deleteTimeline,
  addTimeInterval,
} from "react-timespace";

const REPO_URL = "https://github.com/it-pal-net/react-timespace";

const themeByMode = {
  light: {
    mode: "light",
    color: {
      text: "#172b4d",
      borderHour: "#091e4224",
      clockHandBody: "#0c66e4",
      intervalHandBody: "#50fa7b",
      clockHandTail: "#ae4787",
    },
    size: { borderHour: 2, clockHand: 3 },
  },
  dark: {
    mode: "dark",
    color: {
      text: "#b6c2cf",
      borderHour: "#a6c5e229",
      clockHandBody: "#579dff",
      intervalHandBody: "#50fa7b",
      clockHandTail: "#e774bb",
    },
    size: { borderHour: 2, clockHand: 3 },
  },
};

function getLocalZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
  } catch (e) {
    return "Etc/UTC";
  }
}

const zoneLabel = (timeZone) =>
  (timeZone.split("/").pop() || timeZone).replace(/_/g, " ");

const toTimeLine = (timeZone, orderId) => ({
  id: timeZone,
  orderId,
  name: zoneLabel(timeZone),
  timeZone,
  color: null,
  allowDelete: true,
});

function DemoTimespace() {
  const { tzDispatch, timeLines } = useContext(TimeZonesContext);
  const [isSeeded, setIsSeeded] = useState(false);

  useEffect(() => {
    const zones = [
      ...new Set([getLocalZone(), "America/New_York", "Europe/Berlin"]),
    ];
    tzDispatch(setTimelines(zones.map(toTimeLine)));
    setIsSeeded(true);
  }, []);

  const handleAddZone = () => {
    tzDispatch(
      addTimeline({
        id: `temp-demo-${Date.now()}`,
        orderId: timeLines.length,
        name: null,
        mode: "edit",
        timeZone: getLocalZone(),
        color: null,
        allowDelete: true,
      }),
    );
  };

  const handleAddInterval = () => {
    tzDispatch(
      addTimeInterval({
        id: Date.now().toString(),
        name: "New Time Point",
        time: Date.now(),
        mode: "float",
        actionPoint: "xPos1",
        xPos1: null,
        xPos2: null,
        xPos1DayOffsetSeconds: null,
        xPos2DayOffsetSeconds: null,
        xPos1ClockSide: "right",
        xPos2ClockSide: "right",
        xPos1ClockCollide: null,
        xPos2ClockCollide: null,
        color: null,
        durationPixels: null,
        durationSeconds: null,
        durationHuman: null,
      }),
    );
  };

  return (
    <>
      <div className="controls" style={controlsStyle}>
        <button type="button" style={buttonStyle} onClick={handleAddZone}>
          + Add time zone
        </button>
        <button type="button" style={buttonStyle} onClick={handleAddInterval}>
          + Add interval
        </button>
        <span style={hintStyle}>
          Drag interval edges to resize · drag the arrow to move · drag rows to
          reorder
        </span>
      </div>
      <div style={timespaceAreaStyle}>
        {isSeeded && (
          <Timespace
            showTimezoneAbbreviation={false}
            handleDeleteTimeline={(timeLine) => {
              tzDispatch(deleteTimeline(timeLine.id));
            }}
          />
        )}
      </div>
    </>
  );
}

const controlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 0",
};

const buttonStyle = {
  font: "inherit",
  fontSize: 13,
  color: "var(--text)",
  background: "var(--background-neutral)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "6px 12px",
  cursor: "pointer",
};

const hintStyle = {
  marginLeft: "auto",
  color: "var(--text-subtle)",
  fontSize: 12,
};

const timespaceAreaStyle = {
  position: "relative",
  flex: 1,
  minHeight: 340,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

function Header({ mode, onToggleMode }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <strong style={{ fontSize: 18, marginRight: "auto" }}>
        react-timespace
      </strong>
      <code
        style={{
          fontSize: 12,
          color: "var(--text-subtle)",
          background: "var(--background-neutral)",
          padding: "4px 8px",
          borderRadius: 4,
        }}
      >
        npm install react-timespace
      </code>
      <button type="button" style={buttonStyle} onClick={onToggleMode}>
        {mode === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>
      <a href={REPO_URL} style={{ color: "var(--accent)", fontSize: 14 }}>
        GitHub ★
      </a>
    </header>
  );
}

Header.propTypes = {
  mode: PropTypes.oneOf(["light", "dark"]).isRequired,
  onToggleMode: PropTypes.func.isRequired,
};

export default function App() {
  const [mode, setMode] = useState("dark");
  const theme = useMemo(() => themeByMode[mode], [mode]);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <TimespaceProvider>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            padding: "0 24px 24px",
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          <Header
            mode={mode}
            onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}
          />
          <DemoTimespace />
          <footer
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--text-subtle)",
            }}
          >
            MIT · extracted from{" "}
            <a href="https://synccontact.com" style={{ color: "inherit" }}>
              SyncContact
            </a>{" "}
            ·{" "}
            <a href={REPO_URL} style={{ color: "inherit" }}>
              source
            </a>
          </footer>
        </div>
      </TimespaceProvider>
    </ThemeProvider>
  );
}
