import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import GlobalNav from "../../components/GlobalNav";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <GlobalNav />
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
          }}
        />
        {/* <Tabs.Screen
          name="recall"
          options={{
            title: "Recall",
          }}
        /> */}
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="multiple"
          options={{
            title: "Multiple",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
