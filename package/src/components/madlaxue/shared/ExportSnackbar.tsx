"use client";
import { Snackbar, Alert } from "@mui/material";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ExportSnackbar = ({ open, onClose }: Props) => (
  <Snackbar open={open} autoHideDuration={4000} onClose={onClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
    <Alert onClose={onClose} severity="info" variant="filled">
      Export will be available with backend integration.
    </Alert>
  </Snackbar>
);

export default ExportSnackbar;
