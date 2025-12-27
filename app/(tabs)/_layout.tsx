import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const datestr = new Date().toDateString().slice(4, 15);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000",
        animation: "fade",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitleAlign: "center",
          title: "Home",
          headerTitle: "Today: " + datestr,
          headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
          headerStatusBarHeight: 0,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />
          ),
          headerStyle: { elevation: 1 },
          headerTitleContainerStyle: { elevation: 0, borderWidth: 0 },
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          //   animation: "shift",
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
