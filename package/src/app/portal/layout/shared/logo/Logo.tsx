import Link from "next/link";
import { Box, Typography } from "@mui/material";

const Logo = () => {
  return (
    <Link href="/portal" style={{ textDecoration: "none" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            background: "linear-gradient(180deg, #1E3A5F 0%, #022448 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            M
          </Typography>
        </Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "-0.02em",
            color: "#022448",
            lineHeight: 1,
          }}
        >
          MADLAXUE
        </Typography>
      </Box>
    </Link>
  );
};

export default Logo;
