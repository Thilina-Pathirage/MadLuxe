"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme as useMuiTheme } from "@mui/material/styles";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import { useTheme as useAppTheme } from "@/utils/ThemeContext";
import { usePublicCartCount } from "@/lib/publicCart";
import { useCustomerAuth } from "@/lib/customerAuth";
import LoginDialog from "./LoginDialog";
import SignupDialog from "./SignupDialog";

interface ShopNavbarProps {
  activeLink?: "shop" | "categories";
}

const ShopNavbar = ({ activeLink }: ShopNavbarProps) => {
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === "dark";
  const { toggleTheme, mode: themeMode } = useAppTheme();
  const cartCount = usePublicCartCount();
  const { customer, logout } = useCustomerAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [avatarAnchor, setAvatarAnchor] = useState<null | HTMLElement>(null);

  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#111111";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#333333", 0.68);
  const divider = isDark ? alpha("#FFFFFF", 0.1) : alpha("#111111", 0.1);
  const navBg = isDark ? alpha("#000000", 0.7) : alpha("#F8F6F1", 0.8);

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

  const mobileLinkSx = (isActive: boolean) => ({
    color: isActive ? accent : textMuted,
    borderRadius: "10px",
    px: 1.25,
    py: 1,
    "&:hover": {
      color: textPrimary,
      bgcolor: isDark ? alpha("#FFFFFF", 0.04) : alpha("#111111", 0.04),
    },
  });

  const iconBtnSx = {
    width: 36,
    height: 36,
    borderRadius: "8px",
    border: `1px solid ${divider}`,
    color: textMuted,
    "&:hover": { borderColor: accent, color: accent },
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const initials = customer
    ? customer.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <>
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
                color: "#111111",
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

          {/* Right-side controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              aria-label="Open navigation menu"
              size="small"
              onClick={() => setMobileMenuOpen(true)}
              sx={{
                display: { xs: "inline-flex", md: "none" },
                ...iconBtnSx,
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>

            {/* Desktop nav links */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
              <Box component={Link} href="/shop" sx={navLinkSx(activeLink === "shop")}>
                Shop All
              </Box>
              <Box component={Link} href="/#categories" sx={navLinkSx(activeLink === "categories")}>
                Categories
              </Box>
            </Box>

            {/* Auth — logged out */}
            {!customer && (
              <>
                <Button
                  size="small"
                  onClick={() => setLoginOpen(true)}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    textTransform: "none",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: textMuted,
                    px: 1.4,
                    py: 0.55,
                    border: `1px solid ${divider}`,
                    borderRadius: "8px",
                    "&:hover": { borderColor: accent, color: accent },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  size="small"
                  onClick={() => setSignupOpen(true)}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    textTransform: "none",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    bgcolor: accent,
                    color: "#111111",
                    px: 1.4,
                    py: 0.55,
                    borderRadius: "8px",
                    "&:hover": { bgcolor: "#D4B060" },
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}

            {/* Auth — logged in: avatar */}
            {customer && (
              <>
                <Tooltip title={customer.name} arrow>
                  <IconButton
                    onClick={(e) => setAvatarAnchor(e.currentTarget)}
                    size="small"
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "8px",
                      border: `1px solid ${divider}`,
                      p: 0,
                      overflow: "hidden",
                      "&:hover": { borderColor: accent },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "7px",
                        bgcolor: accent,
                        color: "#111111",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                      }}
                    >
                      {initials}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={avatarAnchor}
                  open={Boolean(avatarAnchor)}
                  onClose={() => setAvatarAnchor(null)}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: "10px",
                      minWidth: 180,
                      bgcolor: isDark ? "#0d1410" : "#FFFFFF",
                      border: `1px solid ${divider}`,
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.2 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: textPrimary }}>{customer.name}</Typography>
                    <Typography sx={{ fontSize: "0.74rem", color: textMuted, mt: 0.1 }}>{customer.email}</Typography>
                  </Box>
                  <Divider sx={{ borderColor: divider }} />
                  <MenuItem
                    component={Link}
                    href="/shop/orders"
                    onClick={() => setAvatarAnchor(null)}
                    sx={{ gap: 1.2, color: textMuted, fontSize: "0.84rem", "&:hover": { color: textPrimary } }}
                  >
                    <ReceiptLongOutlinedIcon fontSize="small" />
                    My Orders
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/shop/profile"
                    onClick={() => setAvatarAnchor(null)}
                    sx={{ gap: 1.2, color: textMuted, fontSize: "0.84rem", "&:hover": { color: textPrimary } }}
                  >
                    <PersonOutlineIcon fontSize="small" />
                    My Profile
                  </MenuItem>
                  <Divider sx={{ borderColor: divider }} />
                  <MenuItem
                    onClick={() => { logout(); setAvatarAnchor(null); }}
                    sx={{ gap: 1.2, color: "error.main", fontSize: "0.84rem" }}
                  >
                    <LogoutIcon fontSize="small" />
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            )}

            {/* Theme toggle */}
            <Tooltip title={themeMode === "dark" ? "Light mode" : "Dark mode"} arrow>
              <IconButton
                onClick={toggleTheme}
                aria-label={themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                size="small"
                sx={iconBtnSx}
              >
                {themeMode === "dark" ? (
                  <LightModeOutlinedIcon sx={{ fontSize: 17 }} />
                ) : (
                  <DarkModeOutlinedIcon sx={{ fontSize: 17 }} />
                )}
              </IconButton>
            </Tooltip>

            {/* Cart — rightmost */}
            <Tooltip title="Cart" arrow>
              <IconButton
                component={Link}
                href="/shop/cart"
                aria-label="Open cart"
                size="small"
                sx={iconBtnSx}
              >
                <Badge
                  badgeContent={cartCount}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      bgcolor: accent,
                      color: "#111111",
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
          </Box>
        </Toolbar>

        {/* Mobile drawer */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={closeMobileMenu}
          PaperProps={{
            sx: {
              width: 270,
              bgcolor: isDark ? "#000000" : "#F8F6F1",
              borderRight: `1px solid ${divider}`,
              pt: 1,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography
              sx={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.12em", color: textPrimary }}
            >
              SHOP MENU
            </Typography>
          </Box>
          <List sx={{ px: 1.2, pt: 0.4 }}>
            <ListItemButton component={Link} href="/shop" onClick={closeMobileMenu} sx={mobileLinkSx(activeLink === "shop")}>
              <ListItemText primary="Shop All" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
            </ListItemButton>
            <ListItemButton component={Link} href="/#categories" onClick={closeMobileMenu} sx={mobileLinkSx(activeLink === "categories")}>
              <ListItemText primary="Categories" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
            </ListItemButton>

            {customer ? (
              <>
                <Divider sx={{ borderColor: divider, my: 1 }} />
                <ListItemButton component={Link} href="/shop/orders" onClick={closeMobileMenu} sx={mobileLinkSx(false)}>
                  <ListItemText primary="My Orders" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
                </ListItemButton>
                <ListItemButton component={Link} href="/shop/profile" onClick={closeMobileMenu} sx={mobileLinkSx(false)}>
                  <ListItemText primary="My Profile" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
                </ListItemButton>
                <ListItemButton
                  onClick={() => { logout(); closeMobileMenu(); }}
                  sx={{ ...mobileLinkSx(false), color: "error.main" }}
                >
                  <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
                </ListItemButton>
              </>
            ) : (
              <>
                <Divider sx={{ borderColor: divider, my: 1 }} />
                <ListItemButton onClick={() => { closeMobileMenu(); setLoginOpen(true); }} sx={mobileLinkSx(false)}>
                  <ListItemText primary="Sign In" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
                </ListItemButton>
                <ListItemButton onClick={() => { closeMobileMenu(); setSignupOpen(true); }} sx={mobileLinkSx(false)}>
                  <ListItemText primary="Sign Up" primaryTypographyProps={{ fontWeight: 700, fontSize: "0.9rem", color: accent }} />
                </ListItemButton>
              </>
            )}
          </List>
        </Drawer>
      </AppBar>

      {/* Auth dialogs */}
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={() => setSignupOpen(true)}
      />
      <SignupDialog
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={() => setLoginOpen(true)}
      />
    </>
  );
};

export default ShopNavbar;
