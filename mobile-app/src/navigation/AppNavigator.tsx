import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LoginScreen } from "@/screens/LoginScreen";
import { ScanScreen } from "@/screens/ScanScreen";
import { ShiftSummaryScreen } from "@/screens/ShiftSummaryScreen";
import { HistoryScreen } from "@/screens/HistoryScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SignOutButton() {
  const { signOut } = useAuth();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
      <Text style={{ color: colors.primary, fontWeight: "600" }}>Sign out</Text>
    </TouchableOpacity>
  );
}

function WaiterTabs() {
  const { user } = useAuth();
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerRight: () => <SignOutButton />,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "scan";
          if (route.name === "Scan") iconName = "scan";
          else if (route.name === "History") iconName = "time-outline";
          else if (route.name === "Shift") iconName = "clipboard-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: `Scan — ${user?.fullName ?? ""}` }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "This shift" }} />
      <Tab.Screen name="Shift" component={ShiftSummaryScreen} options={{ title: "Summary" }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // App is exclusively for waiters now. Admin capabilities belong on the web dashboard.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={WaiterTabs} />
    </Stack.Navigator>
  );
}
