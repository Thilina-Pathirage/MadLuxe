"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  Skeleton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme as useMuiTheme } from "@mui/material/styles";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { publicApi, type PublicTopSellingItem } from "@/lib/api";
import { normalizeVariantImageUrl } from "@/utils/variantImage";
import { useTheme as useAppTheme } from "@/utils/ThemeContext";
import { usePublicCartCount } from "@/lib/publicCart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
const HERO_AUTOPLAY_MS = 6000;

interface Category {
  _id: string;
  name: string;
  description?: string;
  landingImage?: {
    url?: string | null;
  } | null;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  overlay: string;
}

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "new-arrivals",
    title: "Spring Arrivals, Built To Move",
    subtitle:
      "Fresh silhouettes, polished textures, and premium essentials curated for everyday impact.",
    imageUrl:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1800&q=80",
    overlay:
      "linear-gradient(110deg, rgba(8,17,30,0.88) 14%, rgba(8,17,30,0.54) 48%, rgba(8,17,30,0.22) 100%)",
  },
  {
    id: "crafted-basics",
    title: "Crafted Basics, Elevated Finish",
    subtitle:
      "Discover versatile pieces shaped with thoughtful details and enduring comfort.",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=80",
    overlay:
      "linear-gradient(110deg, rgba(7,15,25,0.87) 12%, rgba(7,15,25,0.53) 55%, rgba(7,15,25,0.2) 100%)",
  },
  {
    id: "exclusive-drop",
    title: "Weekend Drop: Limited Stock",
    subtitle:
      "Highly requested picks are back in small quantities. Catch your size before it is gone.",
    imageUrl:
      "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1800&q=80",
    overlay:
      "linear-gradient(105deg, rgba(8,16,26,0.9) 12%, rgba(8,16,26,0.56) 50%, rgba(8,16,26,0.18) 100%)",
  },
];

const CATEGORY_PALETTES = [
  ["#1D3557", "#2A9D8F", "#A8DADC"],
  ["#3A0CA3", "#4361EE", "#4CC9F0"],
  ["#264653", "#2A9D8F", "#E9C46A"],
  ["#4A1942", "#893168", "#F08080"],
  ["#005F73", "#0A9396", "#94D2BD"],
  ["#4F000B", "#720026", "#CE4257"],
];

const hashString = (value: string): number =>
  value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

const getCategoryVisual = (name: string) => {
  const hash = hashString(name);
  const [start, mid, end] = CATEGORY_PALETTES[hash % CATEGORY_PALETTES.length];

  return {
    start,
    mid,
    end,
    label: name.slice(0, 1).toUpperCase(),
    gradient: `linear-gradient(140deg, ${start} 5%, ${mid} 58%, ${end} 100%)`,
    texture:
      "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 45%), radial-gradient(circle at 76% 78%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 36%)",
  };
};

const normalizeBanner = (raw: unknown, index: number): Banner | null => {
  const item = raw as Partial<Banner> & {
    heading?: string;
    description?: string;
    buttonLabel?: string;
    buttonHref?: string;
  };

  const title = item.title ?? item.heading;
  const subtitle = item.subtitle ?? item.description;
  if (!title || !subtitle) return null;

  return {
    id: item.id ?? `remote-${index}`,
    title,
    subtitle,
    imageUrl: normalizeVariantImageUrl(item.imageUrl) ?? FALLBACK_BANNERS[index % FALLBACK_BANNERS.length].imageUrl,
    overlay: item.overlay ?? FALLBACK_BANNERS[index % FALLBACK_BANNERS.length].overlay,
  };
};

export default function LandingPage() {
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === "dark";
  const { toggleTheme, mode: themeMode } = useAppTheme();
  const cartCount = usePublicCartCount();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [topSellingProducts, setTopSellingProducts] = useState<PublicTopSellingItem[]>([]);
  const [loadingTopSelling, setLoadingTopSelling] = useState(true);
  const [topSellingError, setTopSellingError] = useState("");

  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/public/categories`);
        const payload = await response.json();
        if (!cancelled) setCategories(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        if (!cancelled) setCategoriesError("Unable to load categories");
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    };

    const loadBanners = async () => {
      try {
        const response = await fetch(`${API_BASE}/public/banners`);
        const payload = await response.json();
        const parsed = Array.isArray(payload?.data)
          ? payload.data
              .map((item: unknown, idx: number) => normalizeBanner(item, idx))
              .filter((item: Banner | null): item is Banner => Boolean(item))
          : [];
        if (!cancelled && parsed.length > 0) {
          setBanners(parsed);
          setActiveSlide(0);
        }
      } catch {
        // Keep fallback banners when endpoint is unavailable.
      }
    };

    const loadTopSellingProducts = async () => {
      try {
        const payload = await publicApi.getTopSelling(6);
        if (!cancelled) {
          const items = Array.isArray(payload?.data) ? payload.data : [];
          setTopSellingProducts(items);
        }
      } catch {
        if (!cancelled) setTopSellingError("Unable to load top selling products");
      } finally {
        if (!cancelled) setLoadingTopSelling(false);
      }
    };

    void Promise.all([loadCategories(), loadBanners(), loadTopSellingProducts()]);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (activeSlide <= banners.length - 1) return;
    setActiveSlide(0);
  }, [activeSlide, banners.length]);

  useEffect(() => {
    if (prefersReducedMotion || isHeroPaused || banners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, HERO_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [banners.length, isHeroPaused, prefersReducedMotion]);

  const activeBanner = banners[activeSlide] ?? FALLBACK_BANNERS[0];
  const controlsId = useMemo(() => `hero-slider-controls-${activeBanner.id}`, [activeBanner.id]);
  const goPrev = () => setActiveSlide((prev) => (prev - 1 + banners.length) % banners.length);
  const goNext = () => setActiveSlide((prev) => (prev + 1) % banners.length);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [categories],
  );

  // Design tokens
  const accent = "#C9A84C";
  const accentDark = "#A07830";
  const pageBg = isDark ? "#060C14" : "#F8F6F1";
  const textPrimary = isDark ? "#F0EDE8" : "#0F1A2A";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#2C3A4E", 0.68);
  const divider = isDark ? alpha("#FFFFFF", 0.1) : alpha("#0F1A2A", 0.1);
  const navBg = isDark ? alpha("#060C14", 0.7) : alpha("#F8F6F1", 0.8);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: pageBg,
        color: textPrimary,
        "--accent": accent,
        "--accent-dark": accentDark,
        "--ease": "cubic-bezier(0.2, 0.7, 0.2, 1)",
        "@keyframes fadeUp": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& *, & *::before, & *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
          },
        },
      }}
    >
      {/* ─── Navbar ─────────────────────────────────────────────── */}
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
        <Toolbar sx={{ justifyContent: "space-between", minHeight: { xs: 64, md: 72 }, px: { xs: 2, md: 4 } }}>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                background: `linear-gradient(145deg, ${accent} 0%, ${accentDark} 100%)`,
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

          {/* Nav Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button
              component={Link}
              href="/shop"
              size="small"
              sx={{
                color: textMuted,
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "none",
                px: 1.5,
                "&:hover": { color: textPrimary },
              }}
            >
              Shop
            </Button>

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
            
            <Tooltip title={themeMode === "dark" ? "Light mode" : "Dark mode"} arrow>
              <IconButton
                onClick={toggleTheme}
                aria-label={themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
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
                {themeMode === "dark"
                  ? <LightModeOutlinedIcon sx={{ fontSize: 17 }} />
                  : <DarkModeOutlinedIcon sx={{ fontSize: 17 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Hero Slider ────────────────────────────────────────── */}
      <Box
        component="section"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured promotions"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
        onFocusCapture={() => setIsHeroPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsHeroPaused(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
          if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
        }}
        sx={{ position: "relative", minHeight: { xs: "90svh", md: "100svh" }, overflow: "hidden", outline: "none" }}
      >
        {/* Slide backgrounds */}
        {banners.map((banner, index) => {
          const isActive = index === activeSlide;
          return (
            <Box
              key={banner.id}
              aria-hidden={!isActive}
              sx={{
                position: "absolute",
                inset: 0,
                opacity: isActive ? 1 : 0,
                transition: prefersReducedMotion ? "none" : "opacity 700ms var(--ease)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `${banner.overlay}, url(${banner.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  transform: isActive ? "scale(1.04)" : "scale(1.1)",
                  transition: prefersReducedMotion ? "none" : "transform 7s linear",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(6,12,20,0.22) 0%, rgba(6,12,20,0.6) 60%, rgba(6,12,20,0.92) 100%)",
                }}
              />
            </Box>
          );
        })}

        {/* Hero Content */}
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 4,
            height: "100%",
            pt: { xs: 18, md: 22 },
            pb: { xs: 16, md: 18 },
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: "60%" },
              maxWidth: 680,
              animation: prefersReducedMotion ? "none" : "fadeUp 700ms 100ms forwards",
              opacity: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.68rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: accent,
                fontWeight: 600,
                mb: 2.5,
                transition: prefersReducedMotion ? "none" : "opacity 400ms var(--ease)",
              }}
            >
              MADLAXUE COLLECTION
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: "-0.04em",
                fontSize: { xs: "2.4rem", sm: "3rem", md: "4.2rem" },
                color: "#FFFFFF",
                transition: prefersReducedMotion ? "none" : "opacity 400ms var(--ease)",
              }}
            >
              {activeBanner.title}
            </Typography>
            <Typography
              sx={{
                mt: 2.5,
                color: alpha("#F0EDE8", 0.82),
                fontSize: { xs: "0.95rem", md: "1.05rem" },
                lineHeight: 1.7,
                maxWidth: "50ch",
                fontWeight: 300,
                transition: prefersReducedMotion ? "none" : "opacity 400ms var(--ease)",
              }}
            >
              {activeBanner.subtitle}
            </Typography>
            <Box
              sx={{
                mt: 4,
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Button
                component={Link}
                href="#categories"
                variant="contained"
                sx={{
                  bgcolor: accent,
                  color: "#FFFFFF",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.3,
                  fontSize: "0.82rem",
                  letterSpacing: "0.06em",
                  borderRadius: "6px",
                  "&:hover": { bgcolor: "#D4B060" },
                }}
              >
                Shop Collection
              </Button>
              <Button
                component={Link}
                href="/shop"
                variant="outlined"
                sx={{
                  borderColor: alpha("#FFFFFF", 0.5),
                  color: "#FFFFFF",
                  px: 3.5,
                  py: 1.3,
                  fontSize: "0.82rem",
                  letterSpacing: "0.06em",
                  borderRadius: "6px",
                  "&:hover": { borderColor: "#FFFFFF", bgcolor: alpha("#FFFFFF", 0.08) },
                }}
              >
                Shop All
              </Button>
            </Box>
          </Box>
        </Container>

        {/* Slider Controls */}
        <Container
          maxWidth="lg"
          sx={{ position: "absolute", left: 0, right: 0, bottom: { xs: 20, md: 32 }, zIndex: 6 }}
        >
          <Box
            id={controlsId}
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            {/* Arrow Buttons */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                aria-label="Previous slide"
                onClick={goPrev}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "6px",
                  border: `1px solid ${alpha("#FFFFFF", 0.36)}`,
                  color: "#FFFFFF",
                  bgcolor: alpha("#060C14", 0.28),
                  backdropFilter: "blur(4px)",
                  "&:hover": { borderColor: accent, color: accent, bgcolor: alpha("#060C14", 0.5) },
                }}
              >
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton
                aria-label="Next slide"
                onClick={goNext}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "6px",
                  border: `1px solid ${alpha("#FFFFFF", 0.36)}`,
                  color: "#FFFFFF",
                  bgcolor: alpha("#060C14", 0.28),
                  backdropFilter: "blur(4px)",
                  "&:hover": { borderColor: accent, color: accent, bgcolor: alpha("#060C14", 0.5) },
                }}
              >
                <ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>

            {/* Line Indicators */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              {banners.map((banner, index) => {
                const selected = index === activeSlide;
                return (
                  <Box
                    key={banner.id}
                    component="button"
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={selected ? "true" : undefined}
                    sx={{
                      width: selected ? 36 : 18,
                      height: 2,
                      border: "none",
                      p: 0,
                      cursor: "pointer",
                      borderRadius: "2px",
                      bgcolor: selected ? accent : alpha("#FFFFFF", 0.38),
                      transition: "all 300ms var(--ease)",
                      outlineOffset: "4px",
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ─── Categories ─────────────────────────────────────────── */}
      <Container id="categories" maxWidth="lg" sx={{ pt: { xs: 9, md: 13 }, pb: { xs: 9, md: 12 } }}>
        {/* Section Header */}
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: { xs: 4, md: 5 } }}>
          <Box>
            <Typography
              sx={{
                fontSize: "0.68rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: accent,
                fontWeight: 600,
                mb: 1.2,
              }}
            >
              Collections
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                fontSize: { xs: "1.8rem", md: "2.6rem" },
                color: textPrimary,
              }}
            >
              Shop by Category
            </Typography>
          </Box>
          {!loadingCategories && sortedCategories.length > 0 && (
            <Typography
              sx={{
                fontSize: "0.72rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: accent,
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              {sortedCategories.length} categories
            </Typography>
          )}
        </Box>

        {categoriesError && <Alert severity="error" sx={{ mb: 3 }}>{categoriesError}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            gap: { xs: 1.8, md: 2.2 },
          }}
        >
          {loadingCategories
            ? Array.from({ length: 6 }).map((_, i) => (
                <Box
                  key={`cat-skeleton-${i}`}
                  sx={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    aspectRatio: "3 / 4",
                    bgcolor: isDark ? alpha("#0D1825", 0.8) : alpha("#E4DDD4", 0.6),
                  }}
                >
                  <Skeleton variant="rectangular" height="100%" />
                </Box>
              ))
            : sortedCategories.map((cat, index) => {
                const visual = getCategoryVisual(cat.name);
                const orderLabel = String(index + 1).padStart(2, "0");
                const categoryImageUrl = normalizeVariantImageUrl(cat.landingImage?.url);

                return (
                  <Box
                    key={cat._id}
                    component={Link}
                    href={`/shop/category/${cat._id}`}
                    sx={{
                      position: "relative",
                      aspectRatio: "3 / 4",
                      borderRadius: "16px",
                      overflow: "hidden",
                      isolation: "isolate",
                      display: "flex",
                      alignItems: "flex-end",
                      p: { xs: 2.4, md: 2.8 },
                      border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.08)}`,
                      cursor: "pointer",
                      textDecoration: "none",
                      transition: "transform 380ms var(--ease), box-shadow 380ms var(--ease), border-color 300ms var(--ease)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(6,12,20,0.04) 20%, rgba(6,12,20,0.42) 60%, rgba(6,12,20,0.92) 100%)",
                        zIndex: 1,
                      },
                      "& .cat-media": {
                        transition: "transform 900ms var(--ease)",
                      },
                      "&:hover": {
                        transform: "translateY(-6px)",
                        borderColor: alpha(accent, 0.5),
                        boxShadow: isDark
                          ? `0 24px 44px rgba(0,0,0,0.4), 0 0 0 1px ${alpha(accent, 0.2)}`
                          : `0 24px 44px rgba(15,26,42,0.16), 0 0 0 1px ${alpha(accent, 0.2)}`,
                      },
                      "&:hover .cat-media": { transform: "scale(1.07)" },
                    }}
                  >
                    {/* Background */}
                    <Box
                      className="cat-media"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: categoryImageUrl
                          ? `url(${categoryImageUrl})`
                          : `${visual.texture}, ${visual.gradient}`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />

                    {/* Index pill */}
                    <Typography
                      sx={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        zIndex: 2,
                        color: alpha("#FFFFFF", 0.9),
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        letterSpacing: "0.1em",
                        border: "1px solid rgba(255,255,255,0.28)",
                        borderRadius: "4px",
                        px: 0.9,
                        py: 0.3,
                        backdropFilter: "blur(3px)",
                        bgcolor: alpha("#060C14", 0.22),
                      }}
                    >
                      {orderLabel}
                    </Typography>

                    {/* Label */}
                    <Box sx={{ position: "relative", zIndex: 2, width: "100%" }}>
                      <Typography
                        sx={{
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: { xs: "1.5rem", md: "1.85rem" },
                          letterSpacing: "-0.02em",
                          lineHeight: 1.12,
                          textTransform: "capitalize",
                          mb: 1,
                        }}
                      >
                        {cat.name}
                      </Typography>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.7,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: accent,
                          border: `1px solid ${alpha(accent, 0.52)}`,
                          borderRadius: "4px",
                          px: 1.2,
                          py: 0.4,
                          backdropFilter: "blur(3px)",
                          bgcolor: alpha("#060C14", 0.26),
                        }}
                      >
                        Explore
                      </Box>
                    </Box>
                  </Box>
                );
              })}
        </Box>
      </Container>

      {/* ─── Top Selling Products ──────────────────────────────── */}
      <Box sx={{ bgcolor: isDark ? alpha("#0A1422", 0.6) : alpha("#EDE9E2", 0.5), borderTop: `1px solid ${divider}`, borderBottom: `1px solid ${divider}` }}>
        <Container maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
          {/* Header */}
          <Box sx={{ mb: { xs: 4, md: 5 } }}>
            <Typography
              sx={{
                fontSize: "0.68rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: accent,
                fontWeight: 600,
                mb: 1.2,
              }}
            >
              Most Wanted
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  fontSize: { xs: "1.8rem", md: "2.6rem" },
                  color: textPrimary,
                }}
              >
                Top Selling Products
              </Typography>
              <Typography sx={{ color: textMuted, fontSize: "0.88rem", lineHeight: 1.65, maxWidth: "46ch" }}>
                Best-performing picks based on recent order volume.
              </Typography>
            </Box>
          </Box>

          {topSellingError && <Alert severity="error" sx={{ mb: 3 }}>{topSellingError}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: { xs: 1.6, md: 2 },
            }}
          >
            {loadingTopSelling
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Box
                    key={`top-skeleton-${i}`}
                    sx={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      minHeight: 170,
                      bgcolor: isDark ? alpha("#0D1825", 0.8) : alpha("#E4DDD4", 0.5),
                    }}
                  >
                    <Skeleton variant="rectangular" height={170} />
                  </Box>
                ))
              : topSellingProducts.slice(0, 6).map((item, index) => {
                  const variant = item.variant;
                  const productName = variant?.productType?.name ?? "Product";
                  const categoryName = variant?.category?.name ?? "Category";
                  const colorName = variant?.color?.name ?? "";
                  const size = variant?.size && variant.size !== "N/A" ? variant.size : "";
                  const label = [productName, colorName].filter(Boolean).join(" · ");
                  const sold = item.totalQtySold ?? 0;
                  const imageUrl = normalizeVariantImageUrl(variant?.images?.[0]?.url);
                  const fallbackVisual = getCategoryVisual(categoryName);
                  const rankLabel = String(index + 1).padStart(2, "0");

                  return (
                    <Box
                      key={variant?._id ?? `${variant?.sku ?? "top-selling"}-${index}`}
                      sx={{
                        position: "relative",
                        minHeight: 170,
                        borderRadius: "12px",
                        p: 1.8,
                        overflow: "hidden",
                        isolation: "isolate",
                        display: "flex",
                        alignItems: "flex-end",
                        border: `1px solid ${isDark ? alpha("#FFFFFF", 0.1) : alpha("#0F1A2A", 0.08)}`,
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          zIndex: 1,
                          background: "linear-gradient(180deg, rgba(6,12,20,0.1) 20%, rgba(6,12,20,0.56) 58%, rgba(6,12,20,0.92) 100%)",
                        },
                      }}
                    >
                      {/* Background */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: imageUrl
                            ? `url(${imageUrl})`
                            : `${fallbackVisual.texture}, ${fallbackVisual.gradient}`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />

                      {/* Rank badge */}
                      <Typography
                        sx={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          zIndex: 2,
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.06em",
                          color: accent,
                          bgcolor: alpha("#060C14", 0.62),
                          border: `1px solid ${alpha(accent, 0.38)}`,
                          borderRadius: "4px",
                          px: 0.9,
                          py: 0.3,
                        }}
                      >
                        #{rankLabel}
                      </Typography>

                      {/* Sold badge */}
                      <Typography
                        sx={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          zIndex: 2,
                          fontWeight: 700,
                          fontSize: "0.66rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "#FFFFFF",
                          bgcolor: alpha(accent, 0.78),
                          borderRadius: "4px",
                          px: 0.9,
                          py: 0.3,
                        }}
                      >
                        {sold} sold
                      </Typography>

                      {/* Product info */}
                      <Box sx={{ position: "relative", zIndex: 2, minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: "#F0EDE8",
                            fontWeight: 700,
                            fontSize: "0.98rem",
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.3,
                            color: alpha("#D8D4CC", 0.82),
                            fontSize: "0.76rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {[categoryName, size].filter(Boolean).join(" · ")}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
          </Box>

          {!loadingTopSelling && topSellingProducts.length === 0 && !topSellingError && (
            <Typography sx={{ mt: 3, color: textMuted, fontSize: "0.9rem" }}>
              No top selling products available right now.
            </Typography>
          )}
        </Container>
      </Box>

      {/* ─── Service Strip ──────────────────────────────────────── */}
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 6, md: 8 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: { xs: 0, md: 0 },
          borderBottom: `1px solid ${divider}`,
        }}
      >
        {[
          { num: "01", title: "Fast Nationwide Dispatch", body: "Orders confirmed by 3 PM are prioritized for same-day processing." },
          { num: "02", title: "Premium Product Curation", body: "Every drop is reviewed for fit quality, durability, and finish standards." },
          { num: "03", title: "Easy Returns & Exchanges", body: "Flexible return window with dedicated support for quick size and style swaps." },
        ].map((item, i, arr) => (
          <Box
            key={item.num}
            sx={{
              px: { xs: 0, md: i === 0 ? 0 : 4 },
              py: { xs: 3, md: 0 },
              borderTop: { xs: i > 0 ? `1px solid ${divider}` : "none", md: "none" },
              borderLeft: { xs: "none", md: i > 0 ? `1px solid ${divider}` : "none" },
            }}
          >
            <Typography
              sx={{
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.14em",
                color: accent,
                mb: 1.2,
              }}
            >
              {item.num}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: "0.98rem", color: textPrimary, mb: 0.8 }}>
              {item.title}
            </Typography>
            <Typography sx={{ color: textMuted, lineHeight: 1.65, fontSize: "0.88rem" }}>
              {item.body}
            </Typography>
          </Box>
        ))}
      </Container>

      {/* ─── CTA Section ────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          textAlign: "center",
          py: { xs: 10, md: 14 },
          px: 2,
          background: isDark
            ? `radial-gradient(ellipse at 50% 60%, ${alpha(accent, 0.1)} 0%, transparent 68%)`
            : `radial-gradient(ellipse at 50% 60%, ${alpha(accent, 0.08)} 0%, transparent 68%)`,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.68rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accent,
            fontWeight: 600,
            mb: 2,
          }}
        >
          Ready to Start
        </Typography>
        <Typography
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            fontSize: { xs: "2rem", md: "3.4rem" },
            color: textPrimary,
            maxWidth: "14ch",
            mx: "auto",
            mb: 2.5,
          }}
        >
          Make your next signature look.
        </Typography>
        <Typography
          sx={{
            color: textMuted,
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            lineHeight: 1.7,
            maxWidth: "46ch",
            mx: "auto",
            mb: 4.5,
            fontWeight: 300,
          }}
        >
          Step into the newest collection and discover pieces built with intention, craftsmanship, and enduring style.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            component={Link}
            href="/shop"
            variant="contained"
            sx={{
              bgcolor: accent,
              color: "#FFFFFF",
              fontWeight: 700,
              px: 4,
              py: 1.4,
              fontSize: "0.82rem",
              letterSpacing: "0.06em",
              borderRadius: "6px",
              "&:hover": { bgcolor: "#D4B060" },
            }}
          >
            Start Browsing
          </Button>
          
        </Box>
      </Box>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${divider}`,
          py: 3,
          px: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.18em", color: textMuted }}>
              MADLAXUE
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: alpha(textMuted, 0.7) }}>
              © {new Date().getFullYear()} Madlaxue. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
