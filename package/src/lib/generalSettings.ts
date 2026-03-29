"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export type CurrencyCode = "LKR" | "USD" | "EUR" | "GBP";

export interface GeneralSettings {
  _id?: string;
  currencyCode: CurrencyCode;
  timezone: string;
  defaultLowStockThreshold: number;
  defaultDeliveryFee: number;
}

export const GENERAL_SETTINGS_DEFAULTS: GeneralSettings = {
  currencyCode: "LKR",
  timezone: "Asia/Colombo",
  defaultLowStockThreshold: 5,
  defaultDeliveryFee: 300,
};

export const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; label: string; symbol: string }> = [
  { code: "LKR", label: "Sri Lankan Rupee (LKR)", symbol: "Rs." },
  { code: "USD", label: "US Dollar (USD)", symbol: "$" },
  { code: "EUR", label: "Euro (EUR)", symbol: "€" },
  { code: "GBP", label: "British Pound (GBP)", symbol: "£" },
];

export const TIMEZONE_OPTIONS = [
  "Asia/Colombo",
  "Europe/London",
  "America/New_York",
] as const;

type CurrencyFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function getCurrencyOption(code: CurrencyCode) {
  return CURRENCY_OPTIONS.find((option) => option.code === code) ?? CURRENCY_OPTIONS[0];
}

export function formatCurrency(
  value: number | null | undefined,
  currencyCode: CurrencyCode,
  options: CurrencyFormatOptions = {}
) {
  if (value == null || Number.isNaN(value)) return "—";

  const { symbol } = getCurrencyOption(currencyCode);
  const absoluteValue = Math.abs(value);
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(absoluteValue);
  const sign = value < 0 ? "-" : "";

  if (symbol === "$" || symbol === "€" || symbol === "£") return `${sign}${symbol}${number}`;
  return `${sign}${symbol} ${number}`;
}

export function formatBusinessDate(
  value: string | Date | null | undefined,
  businessTimezone: string,
  format = "DD MMM YYYY"
) {
  if (!value) return "—";
  return dayjs(value).tz(businessTimezone).format(format);
}

export function getBusinessToday(businessTimezone: string) {
  return dayjs().tz(businessTimezone).format("YYYY-MM-DD");
}

export function getBusinessMonthKey(businessTimezone: string) {
  return dayjs().tz(businessTimezone).format("YYYY-MM");
}
