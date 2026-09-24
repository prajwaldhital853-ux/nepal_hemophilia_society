/** @type {import('expo/config').ExpoConfig} */
const base = require("./app.json").expo;

// expo-notifications plugin triggers Android push init in Expo Go and crashes startup.
// Include it only on EAS builds where push is supported.
const plugins = [...(base.plugins || [])];
if (process.env.EAS_BUILD === "true") {
  plugins.splice(1, 0, "expo-notifications");
}

module.exports = {
  expo: {
    ...base,
    plugins,
    android: {
      ...base.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
  },
};
