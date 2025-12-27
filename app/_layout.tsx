import { Colors } from "@/constants/theme";
import { HomeProvider } from "@/hooks/useHome";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

function Layout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("hasLaunched").then((value) => {
      if (value === null) {
        router.replace("/onboarding");
      }
      setIsReady(true);
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <HomeProvider>
          <StatusBar style="inverted" />
          <SafeAreaView
            edges={["top"]}
            style={{ flex: 1, backgroundColor: Colors.light.background }}
          >
            <Layout />
          </SafeAreaView>
        </HomeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
