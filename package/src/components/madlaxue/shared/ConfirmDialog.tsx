"use client";
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from "@mui/material";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmColor?: "error" | "primary" | "warning";
}

const ConfirmDialog = ({
  open, title, message, onConfirm, onCancel,
  confirmLabel = "Confirm", confirmColor = "error",
}: Props) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} variant="outlined" size="small">Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color={confirmColor} size="small">
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
