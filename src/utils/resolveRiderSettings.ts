import { format } from "date-fns";

import type { RiderSettings, RiderSettingsTimeline } from "~/sensors/types";

import { resolveTimeline } from "./resolveTimeline";

/**
 * Resolves the rider settings in effect on the given date.
 *
 * Walks through change points (sorted ascending by date) and applies each
 * field that has a value, stopping once past the target date.
 */
export function resolveRiderSettings(
  timeline: RiderSettingsTimeline,
  targetDate: string, // "YYYY-MM-DD"
): RiderSettings {
  const resolved = resolveTimeline(
    timeline.initialValues,
    timeline.changes,
    targetDate,
  );

  return {
    cdA: timeline.cdA,
    crr: timeline.crr,
    bikeWeightKg: timeline.bikeWeightKg,
    ...resolved,
  };
}

/** Resolves settings for today. */
export function resolveCurrentRiderSettings(
  timeline: RiderSettingsTimeline,
): RiderSettings {
  return resolveRiderSettings(timeline, format(new Date(), "yyyy-MM-dd"));
}
