import { Stack } from "expo-router";

import { StatusBar } from "expo-status-bar";

function Layout() {
  const datestr = new Date().toDateString().slice(4, 15);
  return (
    <Stack>
      <Stack.Screen
        name="report"
        options={{
          headerTitleAlign: "center",
          title: "Report",
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          headerTitleAlign: "center",
          title: "Date : " + datestr,
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
