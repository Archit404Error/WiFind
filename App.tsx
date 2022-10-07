import { AppBar } from "@react-native-material/core";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  if (isLoadingComplete) {
    return (
      <SafeAreaProvider>
        <AppBar
          title="Cornell Wi-Find"
          subtitle="Find High Speed Wifi Locations On Campus"
          style={{ paddingTop: 40, paddingBottom: 10, backgroundColor: "red" }}
        />
        <StatusBar style="auto" />
        <Navigation colorScheme={colorScheme} />
      </SafeAreaProvider>
    );
  } else {
    return null;
  }
}
