"use client";

import Link from "next/link";
import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme as useMuiTheme } from "@mui/material/styles";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useTheme as useAppTheme } from "@/utils/ThemeContext";
import { usePublicCartCount } from "@/lib/publicCart";

interface ShopNavbarProps {
  activeLink?: "shop" | "categories";
}

const ShopNavbar = ({ activeLink }: ShopNavbarProps) => {
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === "dark";
  const { toggleTheme, mode: themeMode } = useAppTheme();
  const cartCount = usePublicCartCount();

  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#0F1A2A";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#2C3A4E", 0.68);
  const divider = isDark ? alpha("#FFFFFF", 0.1) : alpha("#0F1A2A", 0.1);
  const navBg = isDark ? alpha("#060C14", 0.7) : alpha("#F8F6F1", 0.8);

  const navLinkSx = (isActive: boolean) => ({
    color: isActive ? accent : textMuted,
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "none" as const,
    textDecoration: "none",
    px: 1.5,
    py: 0.5,
    borderRadius: "6px",
    transition: "color 200ms ease",
    "&:hover": { color: textPrimary },
  });

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: navBg,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${divider}`,
        zIndex: 20,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: { xs: 64, md: 72 },
          px: { xs: 2, md: 4 },
        }}
      >
        {/* Logo */}
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            textDecoration: "none",
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "8px",
              background: `linear-gradient(145deg, ${accent} 0%, #A07830 100%)`,
              display: "grid",
              placeItems: "center",
              color: "#0F1A2A",
              fontWeight: 900,
              fontSize: "0.9rem",
              letterSpacing: "-0.04em",
            }}
          >
            M
          </Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.92rem",
              letterSpacing: "0.18em",
              color: textPrimary,
            }}
          >
            MADLAXUE
          </Typography>
        </Box>

        {/* Nav Links */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            component={Link}
            href="/shop"
            sx={navLinkSx(activeLink === "shop")}
          >
            Shop All
          </Box>
          <Box
            component={Link}
            href="/#categories"
            sx={navLinkSx(activeLink === "categories")}
          >
            Categories
          </Box>

          <Tooltip title="Cart" arrow>
            <IconButton
              component={Link}
              href="/shop/cart"
              aria-label="Open cart"
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                border: `1px solid ${divider}`,
                color: textMuted,
                "&:hover": { borderColor: accent, color: accent },
              }}
            >
              <Badge
                badgeContent={cartCount}
                color="primary"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: accent,
                    color: "#0F1A2A",
                    fontWeight: 700,
                    minWidth: 16,
                    height: 16,
                    fontSize: "0.62rem",
                  },
                }}
              >
                <ShoppingCartOutlinedIcon sx={{ fontSize: 17 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip
            title={themeMode === "dark" ? "Light mode" : "Dark mode"}
            arrow
          >
            <IconButton
              onClick={toggleTheme}
              aria-label={
                themeMode === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                border: `1px solid ${divider}`,
                color: textMuted,
                "&:hover": { borderColor: accent, color: accent },
              }}
            >
              {themeMode === "dark" ? (
                <LightModeOutlinedIcon sx={{ fontSize: 17 }} />
              ) : (
                <DarkModeOutlinedIcon sx={{ fontSize: 17 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ShopNavbar;
