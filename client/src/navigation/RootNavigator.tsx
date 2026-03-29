import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { sectionColors } from "../constants/theme";
import { AuthScreen } from "../screens/AuthScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { GroceryScreen } from "../screens/GroceryScreen";
import { BudgetScreen } from "../screens/BudgetScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { ChoresScreen } from "../screens/ChoresScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#F4F7FB", card: "#FFFFFF", border: "#E5E7EB", text: "#1F2937" },
};

const TabNavigator = () => {
  const { t } = useLocale();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: {
        Home: sectionColors.home,
        Grocery: sectionColors.grocery,
        Budget: sectionColors.budget,
        Calendar: sectionColors.calendar,
        Chores: sectionColors.chores,
      }[route.name],
      tabBarStyle: {
        height: 76,
        paddingBottom: 10,
        paddingTop: 10,
        borderTopWidth: 0,
        elevation: 12,
      },
      tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
      tabBarIcon: ({ color }) => (
        <Text style={{ color, fontSize: 20 }}>
          {route.name === "Home" ? "🏠" : route.name === "Grocery" ? "🛒" : route.name === "Budget" ? "💰" : route.name === "Calendar" ? "📅" : "✅"}
        </Text>
      ),
    })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t("nav.home") }} />
      <Tabs.Screen name="Grocery" component={GroceryScreen} options={{ tabBarLabel: t("nav.grocery") }} />
      <Tabs.Screen name="Budget" component={BudgetScreen} options={{ tabBarLabel: t("nav.budget") }} />
      <Tabs.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: t("nav.calendar") }} />
      <Tabs.Screen name="Chores" component={ChoresScreen} options={{ tabBarLabel: t("nav.chores") }} />
    </Tabs.Navigator>
  );
};

export const RootNavigator = () => {
  const { token } = useAuth();

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? <Stack.Screen name="App" component={TabNavigator} /> : <Stack.Screen name="Auth" component={AuthScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
