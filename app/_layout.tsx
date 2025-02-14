import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="report" />
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
