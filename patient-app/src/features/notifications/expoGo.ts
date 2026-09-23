import Constants from "expo-constants";

/** True when running inside the Expo Go app (not a dev client or release build). */
export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo" || Constants.executionEnvironment === "storeClient";
}
