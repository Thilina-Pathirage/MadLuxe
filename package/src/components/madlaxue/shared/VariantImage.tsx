"use client";

import { useEffect, useState } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import ImagePlaceholder from "./ImagePlaceholder";

interface VariantImageProps {
  src?: string | null;
  alt: string;
  width?: number | string;
  height?: number | string;
  sx?: SxProps<Theme>;
}

const VariantImage = ({ src, alt, width = 40, height = 40, sx }: VariantImageProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <ImagePlaceholder width={width} height={height} />;
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      sx={sx}
    />
  );
};

export default VariantImage;
