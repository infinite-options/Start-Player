import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/theme";

export default function RootLayout() {
  useEffect(function() {
    SystemUI.setBackgroundColorAsync(theme.background); // avoids a white flash before JS loads
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {/* CHANGE: subtle background gradient instead of a flat color, applied once here so every screen gets it */}
      <LinearGradient colors={[theme.backgroundGradientStart, theme.backgroundGradientEnd]} style={{ flex: 1 }}>
        <Slot />
      </LinearGradient>
    </SafeAreaProvider>
  );
}
