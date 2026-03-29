"use client";

import { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { getPrimaryImageUrl } from "@/utils/variantImage";
import StatusChip from "@/components/madlaxue/shared/StatusChip";
import type { PublicVariant } from "@/lib/api";

interface ProductCardProps {
  variant: PublicVariant;
  formatPrice: (value: number) => string;
}

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

const ProductCard = ({ variant, formatPrice }: ProductCardProps) => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = "#C9A84C";

  const imageUrl = getPrimaryImageUrl(variant);
  const isOutOfStock = variant.stockQty === 0;
  const status: "In Stock" | "Low Stock" | "Out of Stock" =
    variant.stockQty === 0
      ? "Out of Stock"
      : variant.stockQty <= 5
        ? "Low Stock"
        : "In Stock";

  const hash = hashString(variant.productType?.name ?? "item");
  const palette = CATEGORY_PALETTES[hash % CATEGORY_PALETTES.length];
  const fallbackGradient = `linear-gradient(140deg, ${palette[0]} 5%, ${palette[1]} 58%, ${palette[2]} 100%)`;
  const detailHref = `/shop/product/${variant._id}`;

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(detailHref);
    }
  };

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`View ${variant.productType?.name ?? "product"}`}
      onClick={() => router.push(detailHref)}
      onKeyDown={handleCardKeyDown}
      elevation={0}
      sx={{
        borderRadius: "14px",
        overflow: "hidden",
        border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.08)}`,
        bgcolor: isDark ? alpha("#0D1825", 0.7) : "#FFFFFF",
        transition:
          "transform 300ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 300ms cubic-bezier(0.2, 0.7, 0.2, 1), border-color 300ms ease",
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: alpha(accent, 0.4),
          boxShadow: isDark
            ? `0 16px 36px rgba(0,0,0,0.35)`
            : `0 16px 36px rgba(15,26,42,0.12)`,
        },
      }}
    >
      {/* Product Image */}
      <CardMedia
        sx={{
          height: 240,
          backgroundImage: imageUrl
            ? `url(${imageUrl})`
            : fallbackGradient,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
          }}
        >
          <StatusChip status={status} size="small" />
        </Box>
      </CardMedia>

      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* Product Name */}
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.92rem",
            lineHeight: 1.3,
            mb: 0.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {variant.productType?.name ?? "Product"}
        </Typography>

        {/* Category */}
        <Typography
          sx={{
            fontSize: "0.72rem",
            color: isDark ? alpha("#D8D4CC", 0.6) : alpha("#2C3A4E", 0.55),
            fontWeight: 500,
            mb: 1,
          }}
        >
          {variant.category?.name}
        </Typography>

        {/* Color & Size */}
        <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap", mb: 1.2 }}>
          {variant.color && (
            <Chip
              size="small"
              label={variant.color.name}
              sx={{
                height: 22,
                fontSize: "0.68rem",
                fontWeight: 600,
                bgcolor: isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.06),
                "& .MuiChip-label": { px: 1 },
              }}
              icon={
                variant.color.hexCode ? (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: variant.color.hexCode,
                      border: "1px solid rgba(0,0,0,0.15)",
                      ml: "6px !important",
                    }}
                  />
                ) : undefined
              }
            />
          )}
          {variant.size && variant.size !== "N/A" && (
            <Chip
              size="small"
              label={variant.size}
              sx={{
                height: 22,
                fontSize: "0.68rem",
                fontWeight: 600,
                bgcolor: isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.06),
                "& .MuiChip-label": { px: 1 },
              }}
            />
          )}
        </Box>

        {/* Price & Cart */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: "auto",
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.05rem",
              color: accent,
              letterSpacing: "-0.01em",
            }}
          >
            {formatPrice(variant.sellPrice)}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            disabled={isOutOfStock}
            onClick={(event) => event.stopPropagation()}
            startIcon={<ShoppingCartOutlinedIcon sx={{ fontSize: "16px !important" }} />}
            sx={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "6px",
              px: 1.5,
              py: 0.4,
              borderColor: isOutOfStock
                ? undefined
                : alpha(accent, 0.5),
              color: isOutOfStock ? undefined : accent,
              "&:hover": isOutOfStock
                ? undefined
                : {
                    borderColor: accent,
                    bgcolor: alpha(accent, 0.08),
                  },
            }}
          >
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
