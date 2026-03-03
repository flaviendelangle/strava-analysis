/**
 * Server-side score computation utilities.
 * Pure functions — no runtime dependencies.
 */

import { resolveTimeline } from "../../src/utils/resolveTimeline";

/**
 * TRIMP gender-specific weighting constants (Banister, 1991).
 *
 * The Banister TRIMP model weights each minute of exercise by a factor that
 * grows exponentially with heart-rate reserve (%HRR). The two constants
 * `a` and `b` control the shape of that exponential curve and differ between
 * sexes because of observed differences in the blood-lactate / HR
 * relationship:
 *
 * - **Male**:   weight = 0.64 · e^(1.92 · %HRR)
 * - **Female**: weight = 0.86 · e^(1.67 · %HRR)
 *
 * Only the male constants are used here.
 */
const TRIMP_A = 0.64;
const TRIMP_B = 1.92;

export interface HrssSettings {
  restingHr: number;
  maxHr: number;
  lthr: number;
}

/**
 * Calculates **HRSS** (Heart Rate Stress Score) from a per-second heart-rate
 * stream and the rider's HR profile settings.
 *
 * HRSS is a normalised form of Banister's TRIMP that is scaled so that
 * **one hour at LTHR produces a score of 100** — the same convention used by
 * power-based TSS.
 *
 * @param hrStream  Per-second heart-rate samples (each index = 1 second).
 * @param settings  Rider settings containing `restingHr`, `maxHr`, and `lthr`.
 * @returns         The HRSS value (unitless, TSS-equivalent scale).
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
  return (
    ((movingTime * weightedAverageWatts * intensityFactor) / (ftp * 3600)) * 100
  );
}

/**
 * Generates power curve duration points (in seconds) up to maxDuration.
 *
 * - Every 10s from 10s to 300s (5 min)
 * - Every 30s from 330s to 1200s (20 min)
 * - Every 120s from 1320s to 3600s (1 h)
 * - Every 300s from 3900s onwards
 */
export function generatePowerCurveDurations(maxDuration: number): number[] {
  const durations: number[] = [];

  for (let d = 10; d <= Math.min(300, maxDuration); d += 10) {
    durations.push(d);
  }
  for (let d = 330; d <= Math.min(1200, maxDuration); d += 30) {
    durations.push(d);
  }
  for (let d = 1320; d <= Math.min(3600, maxDuration); d += 120) {
    durations.push(d);
  }
  for (let d = 3900; d <= maxDuration; d += 300) {
    durations.push(d);
  }

  return durations;
}

/**
 * Computes the maximum average power for each target duration
 * using a sliding window over a per-second watts stream.
 * Durations are generated dynamically based on stream length.
 */
export function computePowerBests(
  wattsStream: number[],
): Record<number, number> {
  const result: Record<number, number> = {};
  const durations = generatePowerCurveDurations(wattsStream.length);

  for (const duration of durations) {
    if (wattsStream.length < duration) continue;

    let windowSum = 0;
    for (let i = 0; i < duration; i++) {
      windowSum += wattsStream[i];
    }
    let maxSum = windowSum;

    for (let i = duration; i < wattsStream.length; i++) {
      windowSum += wattsStream[i] - wattsStream[i - duration];
      if (windowSum > maxSum) {
        maxSum = windowSum;
      }
    }

    result[duration] = Math.round(maxSum / duration);
  }

  return result;
}

interface ResolvedSettings {
  ftp: number;
  weightKg: number;
  restingHr: number;
  maxHr: number;
  lthr: number;
}

interface SettingsTimeline {
  initialValues: ResolvedSettings;
  changes: ({ date: string } & Partial<ResolvedSettings>)[];
}

/**
 * Resolves rider settings for a specific date by walking the change timeline.
 */
export function resolveRiderSettings(
  timeline: SettingsTimeline,
  targetDate: string,
): ResolvedSettings {
  return resolveTimeline(timeline.initialValues, timeline.changes, targetDate);
}
