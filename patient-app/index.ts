import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import { enableScreens } from "react-native-screens";

// Native screen fragments crash on many Motorola / MediaTek devices (e.g. Moto G54).
enableScreens(false);

import App from "./App";

registerRootComponent(App);
