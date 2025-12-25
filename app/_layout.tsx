import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { StatusBar } from "expo-status-bar";

function Layout() {
  const datestr = new Date().toDateString().slice(4, 15);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitleAlign: "center",
          title: "Home",
          headerTitle: "Date : " + datestr,
          headerShadowVisible: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          headerTitleAlign: "center",
          title: "Report",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar-sharp" : "calendar-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function App() {
  return (
    <>
      <StatusBar />

      <Layout />
    </>
  );
}
