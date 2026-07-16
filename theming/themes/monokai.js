const theme = {
  name: "monokai",
  label: "🌴 Monokai",
  light: {
    color: {
      text: "#272822",
      borderHour: "#66d9ef",
      clockHandBody: "#a6e22e",
      intervalHandBody: "#a6e22e",
      clockHandTail: "#f92672",
      contactCardSelected: "#a6e22e",
    },
    background: {
      type: "color",
      color: "#f8f8f2",
    },
  },
  dark: {
    color: {
      text: "#f8f8f2",
      borderHour: "#75715e",
      clockHandBody: "#66d9ef",
      intervalHandBody: "#66d9ef",
      clockHandTail: "#a6e22e",
      contactCardSelected: "#66d9ef",
    },
    background: {
      type: "color",
      color: "#272822",
    },
  },
  size: {
    borderHour: 2,
    clockHand: 3,
  },
  type: "system",
};

export default theme;
