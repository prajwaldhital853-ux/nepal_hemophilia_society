import { Linking } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import type { AppService } from "@/features/services/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function openPatientService(navigation: Nav, service: AppService) {
  if (service.actionType === "url" && service.actionValue) {
    void Linking.openURL(service.actionValue);
    return;
  }
  if (service.actionType === "app_screen") {
    if (service.slug === "analytics") {
      navigation.navigate("Insights");
      return;
    }
    switch (service.actionValue) {
      case "Treatments":
        navigation.navigate("Treatments");
        return;
      case "Injections":
        navigation.navigate("Injections");
        return;
      case "Documents":
        navigation.navigate("Documents");
        return;
      case "Bleeding":
        navigation.navigate("Bleeding");
        return;
      case "Factor":
        navigation.navigate("Factor");
        return;
      case "Insights":
      case "Analytics":
        navigation.navigate("Insights");
        return;
      case "Centers":
        navigation.navigate("Centers");
        return;
      case "EmergencyId":
        navigation.navigate("EmergencyId");
        return;
      case "Settings":
        navigation.navigate("Settings");
        return;
      case "Home":
        navigation.navigate("Home");
        return;
      case "Profile":
        navigation.navigate("Profile");
        return;
      case "Notifications":
        navigation.navigate("Notifications");
        return;
      default:
        break;
    }
  }
  if (
    service.actionType === "news" ||
    service.actionType === "events" ||
    service.actionType === "resources" ||
    service.actionType === "gallery"
  ) {
    navigation.navigate("ServiceContentList", { kind: service.actionType, title: service.title });
    return;
  }
  navigation.navigate("ServiceDetail", { slug: service.slug, title: service.title });
}
