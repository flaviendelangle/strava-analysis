import * as React from "react";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { useAthleteId } from "~/hooks/useAthleteId";
import {
  DEFAULT_RIDER_SETTINGS,
  DEFAULT_RIDER_SETTINGS_TIMELINE,
  type RiderSettings,
  type RiderSettingsTimeline,
} from "~/sensors/types";
import {
  resolveCurrentRiderSettings,
  resolveRiderSettings,
} from "~/utils/resolveRiderSettings";

interface RiderSettingsContextValue {
  timeline: RiderSettingsTimeline;
  setTimeline: (timeline: RiderSettingsTimeline) => void;
  resolveForDate: (date: string) => RiderSettings;
  currentSettings: RiderSettings;
}

const RiderSettingsContext = React.createContext<RiderSettingsContextValue>({
  timeline: DEFAULT_RIDER_SETTINGS_TIMELINE,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setTimeline: () => {},
  resolveForDate: () => DEFAULT_RIDER_SETTINGS,
  currentSettings: DEFAULT_RIDER_SETTINGS,
});

export function RiderSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const athleteId = useAthleteId();
  const stored = useQuery(
    api.queries.getRiderSettings,
    athleteId != null ? { athleteId } : "skip",
  );
  const saveSettings = useMutation(api.mutations.saveRiderSettings);

  const timeline: RiderSettingsTimeline = stored
    ? {
        cdA: stored.cdA,
        crr: stored.crr,
        bikeWeightKg: stored.bikeWeightKg ?? DEFAULT_RIDER_SETTINGS_TIMELINE.bikeWeightKg,
        initialValues: stored.initialValues,
        changes: stored.changes,
      }
    : DEFAULT_RIDER_SETTINGS_TIMELINE;

  const setTimeline = React.useCallback(
    (newTimeline: RiderSettingsTimeline) => {
      if (athleteId == null) return;
      saveSettings({
        athleteId,
        cdA: newTimeline.cdA,
        crr: newTimeline.crr,
        bikeWeightKg: newTimeline.bikeWeightKg,
        initialValues: newTimeline.initialValues,
        changes: newTimeline.changes,
      });
    },
    [athleteId, saveSettings],
  );

  const resolveForDate = React.useCallback(
    (date: string) => resolveRiderSettings(timeline, date),
    [timeline],
  );

  const currentSettings = React.useMemo(
    () => resolveCurrentRiderSettings(timeline),
    [timeline],
  );

  const value = React.useMemo(
    () => ({ timeline, setTimeline, resolveForDate, currentSettings }),
    [timeline, setTimeline, resolveForDate, currentSettings],
  );

  return (
    <RiderSettingsContext value={value}>{children}</RiderSettingsContext>
  );
}

/** Full timeline access — for the settings page and activity stats. */
export function useRiderSettingsTimeline(): RiderSettingsContextValue {
  return React.useContext(RiderSettingsContext);
}

/** Backward-compatible hook — returns today's resolved settings. */
export function useRiderSettings(): [RiderSettings] {
  const { currentSettings } = React.useContext(RiderSettingsContext);
  return [currentSettings];
}
