const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { resolve } = require("metro-resolver");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Bundle a no-op module instead of expo-notifications during Expo Go / local dev.
const useRealNotifications = process.env.EAS_BUILD === "true";
const notificationsStub = path.resolve(__dirname, "src/features/notifications/expoNotificationsStub.ts");

if (!useRealNotifications) {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "expo-notifications") {
      return { filePath: notificationsStub, type: "sourceFile" };
    }
    return resolve(context, moduleName, platform);
  };
}

module.exports = config;
