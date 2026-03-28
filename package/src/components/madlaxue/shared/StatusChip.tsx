"use client";
import { Chip } from "@mui/material";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

interface Props {
  status: StockStatus;
  size?: "small" | "medium";
}

const colorMap: Record<StockStatus, "success" | "warning" | "error"> = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "error",
};

const StatusChip = ({ status, size = "small" }: Props) => (
  <Chip label={status} color={colorMap[status]} size={size} />
);

export default StatusChip;
