const theme = {
  name: "night-owl",
  label: "🦉 Night Owl",
  light: {
    color: {
      text: "#011627",
      borderHour: "#82aaff",
      clockHandBody: "#ecc48d",
      intervalHandBody: "#ecc48d",
      clockHandTail: "#7e57c2",
      contactCardSelected: "#ecc48d",
    },
    background: {
      type: "color",
      color: "#fafafa",
    },
  },
  dark: {
    color: {
      text: "#d6deeb",
      borderHour: "#5f7e97",
      clockHandBody: "#82aaff",
      intervalHandBody: "#82aaff",
      clockHandTail: "#ecc48d",
      contactCardSelected: "#82aaff",
    },
    background: {
      type: "color",
      color: "#011627",
    },
  },
  size: {
    borderHour: 2,
    clockHand: 3,
  },
  type: "system",
};

export default theme;
