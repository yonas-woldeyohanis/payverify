import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "@/config/env";

type ThemeType = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: any;
}

export const lightColors = {
  background: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14181F",
  textSecondary: "#6B7280",
  primary: ENV.PRIMARY_COLOR,
  border: "#E5E7EB",
  danger: "#E07856",
  success: "#10B981"
};

export const darkColors = {
  background: "#14181F",
  card: "#1E242D",
  text: "#FFFFFF",
  textSecondary: "#9AA3AF",
  primary: ENV.PRIMARY_COLOR,
  border: "#2A323D",
  danger: "#E07856",
  success: "#10B981"
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(systemTheme === "dark" ? "dark" : "light");

  useEffect(() => {
    AsyncStorage.getItem("app_theme").then((savedTheme) => {
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    AsyncStorage.setItem("app_theme", newTheme);
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
