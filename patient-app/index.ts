import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import { enableScreens } from "react-native-screens";

enableScreens(true);

import App from "./App";

registerRootComponent(App);
