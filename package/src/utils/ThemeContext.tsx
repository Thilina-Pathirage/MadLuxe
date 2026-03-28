"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { baselightTheme, basedarkTheme } from "./theme/DefaultColors";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeContextProvider");
  }
  return context;
};

interface ThemeContextProviderProps {
  children: React.ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme-mode") as ThemeMode | null;

    if (savedTheme) {
      setMode(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setMode(prefersDark ? "dark" : "light");
    }

    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === "light" ? "dark" : "light";
      localStorage.setItem("theme-mode", newMode);
      return newMode;
    });
  };

  const theme = mode === "light" ? baselightTheme : basedarkTheme;

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return <ThemeProvider theme={baselightTheme}>{children}</ThemeProvider>;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
