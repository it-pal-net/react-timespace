import { useContext, useEffect, useState } from "react";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

import {
  Timespace,
  TimespaceProvider,
  TimeZonesContext,
  TimespaceThemeProvider,
  setTimelines,
  addTimeline,
  deleteTimeline,
  addTimeInterval,
} from "react-timespace";
import ThemeConfig from "react-timespace/theme-config";
import useLocalStorage from "react-timespace/hooks/useLocalStorage";

const REPO_URL = "https://github.com/it-pal-net/react-timespace";

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

// Reflects the active theme onto the page: data-theme drives the demo.css
// token blocks, and the widget-facing vars + font + background are set from
// the theme so configurator changes apply live.
function ThemeSurface() {
  const theme = useTheme();

  useEffect(() => {
    document.documentElement.dataset.theme = theme.mode;
  }, [theme.mode]);

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    const colorVars = {
      "--text": theme.color?.text,
      "--timeline-text": theme.color?.text,
      "--clockHandBody": theme.color?.clockHandBody,
      "--clockHandTail": theme.color?.clockHandTail,
    };
    Object.entries(colorVars).forEach(([name, value]) => {
      if (value) {
        rootStyle.setProperty(name, value);
      } else {
        rootStyle.removeProperty(name);
      }
    });
    return () => {
      Object.keys(colorVars).forEach((name) => rootStyle.removeProperty(name));
    };
  }, [theme.color]);

  useEffect(() => {
    if (!theme.font) {
      return undefined;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${theme.font}&display=swap`;
    document.head.appendChild(link);

    const family = theme.font.split(":")[0];
    document.body.style.fontFamily = `${family}, ui-sans-serif, system-ui, sans-serif`;

    return () => {
      link.remove();
      document.body.style.fontFamily = "";
    };
  }, [theme.font]);

  useEffect(() => {
    if (theme.background?.type !== "color" || !theme.background.color) {
      return undefined;
    }
    document.body.style.background = theme.background.color;
    return () => {
      document.body.style.background = "";
    };
  }, [theme.background]);

  return null;
}

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

const themePanelStyle = {
  width: 380,
  flexShrink: 0,
  overflowY: "auto",
  borderLeft: "1px solid var(--border)",
};

function Header({ mode, onToggleMode, isThemePanelOpen, onToggleThemePanel }) {
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
      <button type="button" style={buttonStyle} onClick={onToggleThemePanel}>
        {isThemePanelOpen ? "✕ Close theme" : "🎨 Theme"}
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
  isThemePanelOpen: PropTypes.bool.isRequired,
  onToggleThemePanel: PropTypes.func.isRequired,
};

export default function App() {
  const [mode, setMode] = useLocalStorage("themeMode", "dark");
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  return (
    <TimespaceThemeProvider>
      <ThemeSurface />
      <TimespaceProvider>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
              padding: "0 24px 24px",
              maxWidth: 1280,
              margin: "0 auto",
            }}
          >
            <Header
              mode={mode}
              onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}
              isThemePanelOpen={isThemePanelOpen}
              onToggleThemePanel={() => setIsThemePanelOpen((open) => !open)}
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
          {isThemePanelOpen && (
            <aside style={themePanelStyle} aria-label="Theme configurator">
              <ThemeConfig />
            </aside>
          )}
        </div>
      </TimespaceProvider>
    </TimespaceThemeProvider>
  );
}
