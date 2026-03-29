"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ShopNavbar from "@/components/shop/ShopNavbar";
import ShopFooter from "@/components/shop/ShopFooter";

export default function ShopLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const pageBg = isDark ? "#060C14" : "#F8F6F1";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, display: "flex", flexDirection: "column" }}>
      <ShopNavbar activeLink="shop" />
      <Box sx={{ flexGrow: 1, pt: { xs: "64px", md: "72px" } }}>{children}</Box>
      <ShopFooter />
    </Box>
  );
}
