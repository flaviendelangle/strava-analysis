import * as React from "react";

import { DEFAULT_RIDER_SETTINGS, type RiderSettings } from "~/sensors/types";

const STORAGE_KEY = "riderSettings";

function loadSettings(): RiderSettings {
  if (typeof window === "undefined") return DEFAULT_RIDER_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as RiderSettings;
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_RIDER_SETTINGS;
}

interface RiderSettingsContextValue {
  riderSettings: RiderSettings;
  setRiderSettings: (settings: RiderSettings) => void;
}

const RiderSettingsContext = React.createContext<RiderSettingsContextValue>({
  riderSettings: DEFAULT_RIDER_SETTINGS,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setRiderSettings: () => {},
});

export function RiderSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettingsState] = React.useState<RiderSettings>(loadSettings);

  const setSettings = React.useCallback((newSettings: RiderSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettingsState(newSettings);
  }, []);

  const value = React.useMemo(
    () => ({ riderSettings: settings, setRiderSettings: setSettings }),
    [settings, setSettings],
  );

  return (
    <RiderSettingsContext value={value}>{children}</RiderSettingsContext>
  );
}

export function useRiderSettings(): [
  RiderSettings,
  (settings: RiderSettings) => void,
] {
  const { riderSettings, setRiderSettings } = React.useContext(RiderSettingsContext);
  return [riderSettings, setRiderSettings];
}
