"use client";
import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, subtitle, actions }: Props) => (
  <Box
    sx={{
      display: "flex",
      alignItems: { xs: "flex-start", sm: "center" },
      flexDirection: { xs: "column", sm: "row" },
      justifyContent: "space-between",
      gap: 2,
      mb: 3,
    }}
  >
    <Box>
      <Typography variant="h4" sx={{ color: "primary.dark", letterSpacing: "-0.01em" }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>{actions}</Box>}
  </Box>
);

export default PageHeader;
