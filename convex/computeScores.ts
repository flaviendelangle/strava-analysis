/**
 * Server-side score computation utilities.
 * Pure functions — no Convex runtime dependencies, runs in V8.
 */

// Banister TRIMP male constants
const TRIMP_A = 0.64;
const TRIMP_B = 1.92;

interface HrssSettings {
  restingHr: number;
  maxHr: number;
  lthr: number;
}

/**
 * Calculates HRSS (Heart Rate Stress Score) from a per-second HR stream.
 * One hour at LTHR = 100.
 */
export function calculateHRSS(
  hrStream: number[],
  settings: HrssSettings,
): number {
  const { restingHr, maxHr, lthr } = settings;
  const hrRange = maxHr - restingHr;

  if (hrRange <= 0 || hrStream.length === 0) {
    return 0;
  }

  const hrrAtFtp = Math.max(0, Math.min(1, (lthr - restingHr) / hrRange));
  const oneHourFtpTrimp =
    hrrAtFtp * TRIMP_A * Math.exp(TRIMP_B * hrrAtFtp) * 60;

  if (oneHourFtpTrimp === 0) {
    return 0;
  }

  const dtMinutes = 1 / 60;
  let exerciseTrimp = 0;

  for (const hr of hrStream) {
    const hrr = Math.max(0, Math.min(1, (hr - restingHr) / hrRange));
    exerciseTrimp += dtMinutes * hrr * TRIMP_A * Math.exp(TRIMP_B * hrr);
  }

  return (exerciseTrimp / oneHourFtpTrimp) * 100;
}

/**
 * Calculates TSS (Training Stress Score) from activity metadata.
 */
export function calculateTSS(
  weightedAverageWatts: number,
  movingTime: number,
  ftp: number,
): number {
  if (ftp <= 0 || movingTime <= 0) return 0;
  const intensityFactor = weightedAverageWatts / ftp;
  return ((movingTime * weightedAverageWatts * intensityFactor) / (ftp * 3600)) * 100;
}

interface ResolvedSettings {
  ftp: number;
  weightKg: number;
  restingHr: number;
  maxHr: number;
  lthr: number;
}

interface SettingsTimeline {
  initialValues: {
    ftp: number;
    weightKg: number;
    restingHr: number;
    maxHr: number;
    lthr: number;
  };
  changes: Array<{
    date: string;
    ftp?: number;
    weightKg?: number;
    restingHr?: number;
    maxHr?: number;
    lthr?: number;
  }>;
}

/**
 * Resolves rider settings for a specific date by walking the change timeline.
 *
 * NOTE: The core logic is duplicated in src/utils/resolveRiderSettings.ts for
 * client-side use (which also resolves cdA/crr/bikeWeightKg). Keep both in sync.
 */
export function resolveRiderSettings(
  timeline: SettingsTimeline,
  targetDate: string,
): ResolvedSettings {
  const result: ResolvedSettings = { ...timeline.initialValues };

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
