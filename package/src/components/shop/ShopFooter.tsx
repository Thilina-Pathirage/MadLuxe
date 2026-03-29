"use client";

import { Box, Container, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const ShopFooter = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const textMuted = isDark
    ? alpha("#D8D4CC", 0.72)
    : alpha("#2C3A4E", 0.68);
  const divider = isDark
    ? alpha("#FFFFFF", 0.1)
    : alpha("#0F1A2A", 0.1);

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${divider}`,
        py: 3,
        px: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: textMuted,
            }}
          >
            MADLAXUE
          </Typography>
          <Typography
            sx={{ fontSize: "0.72rem", color: alpha(textMuted, 0.7) }}
          >
            &copy; {new Date().getFullYear()} Madlaxue. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ShopFooter;
