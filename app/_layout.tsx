import { Stack } from "expo-router";

import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView } from "react-native";

function Layout() {
  const datestr = new Date().toDateString().slice(4, 15);
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: "Date : " + datestr,
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="report"
        options={{
          headerTitleAlign: "center",
          title: "Report",
          headerShadowVisible: true,
        }}
      />
    </Stack>
  );
}

export default function App() {
  return (
    <>
      <StatusBar style="inverted" />

      <Layout />
    </>
  );
}
