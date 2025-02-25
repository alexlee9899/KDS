import { View } from "react-native";
import { Tabs } from "expo-router";
import GlobalNav from "../../components/GlobalNav";

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
          }}
        />
      </Tabs>
    </View>
  );
}
