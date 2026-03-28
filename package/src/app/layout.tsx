"use client";
import React from "react";
import { ThemeContextProvider } from "@/utils/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "./global.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeContextProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AuthProvider>
              <CssBaseline />
              {children}
            </AuthProvider>
          </LocalizationProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
