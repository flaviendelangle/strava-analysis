import { format } from "date-fns";

import type { RiderSettings, RiderSettingsTimeline } from "~/sensors/types";

/**
 * Resolves the rider settings in effect on the given date.
 *
 * Walks through change points (sorted ascending by date) and applies each
 * field that has a value, stopping once past the target date.
 *
 * NOTE: The core logic is duplicated in convex/computeScores.ts for server-side
 * score computation (which only resolves HR/power fields). Keep both in sync.
 */
export function resolveRiderSettings(
  timeline: RiderSettingsTimeline,
  targetDate: string, // "YYYY-MM-DD"
): RiderSettings {
  const result: RiderSettings = {
    cdA: timeline.cdA,
    crr: timeline.crr,
    bikeWeightKg: timeline.bikeWeightKg,
    ...timeline.initialValues,
  };

  for (const change of timeline.changes) {
    if (change.date > targetDate) break;
    if (change.ftp !== undefined) result.ftp = change.ftp;
    if (change.weightKg !== undefined) result.weightKg = change.weightKg;
    if (change.restingHr !== undefined) result.restingHr = change.restingHr;
    if (change.maxHr !== undefined) result.maxHr = change.maxHr;
    if (change.lthr !== undefined) result.lthr = change.lthr;
  }

  return result;
}

/** Resolves settings for today. */
export function resolveCurrentRiderSettings(
  timeline: RiderSettingsTimeline,
): RiderSettings {
  return resolveRiderSettings(timeline, format(new Date(), "yyyy-MM-dd"));
}
