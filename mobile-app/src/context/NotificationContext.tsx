import React, { createContext, useContext, useState, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NotificationContextValue {
  showNotification: (message: string, type?: "success" | "error" | "info") => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;

  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    Animated.sequence([
      Animated.spring(translateY, { toValue: 50, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start(() => setNotification(null));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Animated.View style={[styles.toast, { transform: [{ translateY }] }]}>
          <Ionicons 
            name={notification.type === "success" ? "checkmark-circle" : notification.type === "error" ? "warning" : "information-circle"} 
            size={24} 
            color={notification.type === "error" ? "#E07856" : notification.type === "success" ? "#10B981" : "#B8863C"} 
          />
          <Text style={styles.toastText}>{notification.message}</Text>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: "#1E242D",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#2A323D",
    zIndex: 9999,
  },
  toastText: { color: "#fff", fontSize: 16, marginLeft: 12, fontWeight: "500" },
});

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
};
