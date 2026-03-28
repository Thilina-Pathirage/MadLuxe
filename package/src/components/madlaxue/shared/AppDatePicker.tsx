"use client";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

interface Props {
  label: string;
  value: string;          // "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  size?: "small" | "medium";
  sx?: object;
}

export default function AppDatePicker({ label, value, onChange, required, disabled, size = "small", sx }: Props) {
  const dayjsValue = value ? dayjs(value) : null;

  return (
    <DatePicker
      label={label}
      value={dayjsValue}
      onChange={(newVal: Dayjs | null) => onChange(newVal ? newVal.format("YYYY-MM-DD") : "")}
      disabled={disabled}
      format="DD/MM/YYYY"
      slotProps={{
        textField: {
          size,
          fullWidth: true,
          required,
          sx,
        },
        openPickerButton: { size: "small" },
      }}
    />
  );
}
