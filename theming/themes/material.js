const theme = {
  name: "material",
  label: "📐 Material Theme",
  light: {
    color: {
      text: "#263238",
      borderHour: "#80cbc4",
      clockHandBody: "#ffcc80",
      intervalHandBody: "#ffcc80",
      clockHandTail: "#e91e63",
      contactCardSelected: "#ffcc80",
    },
    background: {
      type: "color",
      color: "#ffffff",
    },
  },
  dark: {
    color: {
      text: "#b0bec5",
      borderHour: "#546e7a",
      clockHandBody: "#80cbc4",
      intervalHandBody: "#80cbc4",
      clockHandTail: "#ffcc80",
      contactCardSelected: "#80cbc4",
    },
    background: {
      type: "color",
      color: "#263238",
    },
  },
  size: {
    borderHour: 2,
    clockHand: 3,
  },
  type: "system",
};

export default theme;
