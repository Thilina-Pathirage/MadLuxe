"use client";
import { Box } from "@mui/material";
import { IconPhoto } from "@tabler/icons-react";

interface Props {
  width?: number | string;
  height?: number | string;
}

const ImagePlaceholder = ({ width = 40, height = 40 }: Props) => {
  const parsedHeight =
    typeof height === "number" ? height : Number.parseInt(String(height), 10);
  const iconSize = Number.isFinite(parsedHeight) ? Math.min(parsedHeight * 0.5, 20) : 20;

  return (
    <Box
      sx={{
        width,
        height,
        bgcolor: "grey.200",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "grey.400",
      }}
    >
      <IconPhoto size={iconSize} stroke={1.5} />
    </Box>
  );
};

export default ImagePlaceholder;
