"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  formatBusinessDate,
  formatCurrency,
  GENERAL_SETTINGS_DEFAULTS,
  GeneralSettings,
  getBusinessMonthKey,
  getBusinessToday,
} from "@/lib/generalSettings";

interface GeneralSettingsContextValue {
  settings: GeneralSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (nextSettings: GeneralSettings) => Promise<GeneralSettings>;
  formatCurrency: (
    value: number | null | undefined,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
  ) => string;
  formatBusinessDate: (value: string | Date | null | undefined, format?: string) => string;
  getBusinessToday: () => string;
  getBusinessMonthKey: () => string;
}

const GeneralSettingsContext = createContext<GeneralSettingsContextValue | undefined>(undefined);

export function useGeneralSettings() {
  const context = useContext(GeneralSettingsContext);
  if (!context) {
    throw new Error("useGeneralSettings must be used within GeneralSettingsProvider");
  }
  return context;
}

export function GeneralSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GeneralSettings>(GENERAL_SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await api.getGeneralSettings();
      setSettings(response.data ?? GENERAL_SETTINGS_DEFAULTS);
    } catch {
      setSettings(GENERAL_SETTINGS_DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(async (nextSettings: GeneralSettings) => {
    const response = await api.updateGeneralSettings(nextSettings);
    const resolvedSettings = response.data ?? nextSettings;
    setSettings(resolvedSettings);
    return resolvedSettings;
  }, []);

  const value = useMemo<GeneralSettingsContextValue>(() => ({
    settings,
    loading,
    refreshSettings,
    updateSettings,
    formatCurrency: (value, options) => formatCurrency(value, settings.currencyCode, options),
    formatBusinessDate: (value, format) => formatBusinessDate(value, settings.timezone, format),
    getBusinessToday: () => getBusinessToday(settings.timezone),
    getBusinessMonthKey: () => getBusinessMonthKey(settings.timezone),
  }), [loading, refreshSettings, settings, updateSettings]);

  return (
    <GeneralSettingsContext.Provider value={value}>
      {children}
    </GeneralSettingsContext.Provider>
  );
}
