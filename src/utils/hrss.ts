import type { RiderSettings } from "~/sensors/types";

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

/**
 * Calculates **HRSS** (Heart Rate Stress Score) from a per-second heart-rate
 * stream and the rider's HR profile settings.
 *
 * ## What is HRSS?
 *
 * HRSS is a normalised form of Banister's **TRIMP** (TRaining IMPulse) that is
 * scaled so that **one hour at Lactate Threshold Heart Rate (LTHR) produces a
 * score of 100** — the same convention used by power-based TSS (Training Stress
 * Score). This makes HR-based and power-based training loads directly
 * comparable.
 *
 * ## How TRIMP works
 *
 * The Banister (1991) TRIMP model assigns a physiological "cost" to every
 * minute of exercise. For each minute, the cost depends on the fraction of
 * Heart Rate Reserve (%HRR) being used:
 *
 *     %HRR = (HR − restingHR) / (maxHR − restingHR)
 *
 * The per-minute TRIMP contribution is then:
 *
 *     TRIMP_minute = %HRR × a × e^(b × %HRR)
 *
 * where `a` and `b` are gender-specific constants (male: a = 0.64, b = 1.92;
 * female: a = 0.86, b = 1.67). The exponential weighting reflects the fact
 * that blood-lactate accumulation — and therefore physiological strain — rises
 * exponentially with exercise intensity, not linearly. Spending one minute at
 * 90 % HRR is considerably more stressful than at 60 % HRR, and the
 * exponential captures that non-linearity.
 *
 * Total exercise TRIMP is simply the sum over every minute (or fraction of a
 * minute) of the session.
 *
 * ## Normalising TRIMP → HRSS
 *
 * Raw TRIMP values are athlete-specific and hard to interpret on their own.
 * To normalise them to the TSS scale we compute a **reference TRIMP**: the
 * TRIMP that a hypothetical 60-minute effort exactly at LTHR would produce.
 *
 *     %HRR_FTP = (LTHR − restingHR) / (maxHR − restingHR)
 *     referenceTrimp = %HRR_FTP × a × e^(b × %HRR_FTP) × 60
 *
 * HRSS is then:
 *
 *     HRSS = (exerciseTrimp / referenceTrimp) × 100
 *
 * By construction, one hour at LTHR yields exactly HRSS = 100.
 *
 * ## Required rider settings
 *
 * | Setting      | Description                                        |
 * |--------------|----------------------------------------------------|
 * | `restingHr`  | Resting heart rate in bpm (measured at full rest)   |
 * | `maxHr`      | Maximum heart rate in bpm                           |
 * | `lthr`       | Lactate Threshold Heart Rate — HR at FTP, in bpm    |
 *
 * ## References
 *
 * - Banister, E.W. (1991). "Modeling elite athletic performance."
 * - Elevate / Stravistix — https://github.com/thomaschampagne/elevate/issues/341
 * - Intervals.icu — uses this method as "HRSS" for non-power activities.
 *
 * @param hrStream  Per-second heart-rate samples (each index = 1 second).
 * @param settings  Rider settings containing `restingHr`, `maxHr`, and `lthr`.
 * @returns         The HRSS value (unitless, TSS-equivalent scale).
 */
export function calculateHRSS(
  hrStream: number[],
  settings: RiderSettings,
): number {
  const { restingHr, maxHr, lthr } = settings;
  const hrRange = maxHr - restingHr;

  if (hrRange <= 0 || hrStream.length === 0) {
    return 0;
  }

  // ── Step 1: Reference TRIMP (1 h at LTHR) ──────────────────────────
  const hrrAtFtp = Math.max(0, Math.min(1, (lthr - restingHr) / hrRange));
  const oneHourFtpTrimp =
    hrrAtFtp * TRIMP_A * Math.exp(TRIMP_B * hrrAtFtp) * 60;

  if (oneHourFtpTrimp === 0) {
    return 0;
  }

  // ── Step 2: Exercise TRIMP from HR stream ───────────────────────────
  // Each sample represents 1 second = 1/60 of a minute.
  const dtMinutes = 1 / 60;
  let exerciseTrimp = 0;

  for (const hr of hrStream) {
    const hrr = Math.max(0, Math.min(1, (hr - restingHr) / hrRange));
    exerciseTrimp += dtMinutes * hrr * TRIMP_A * Math.exp(TRIMP_B * hrr);
  }

  // ── Step 3: Normalise to TSS scale ──────────────────────────────────
  return (exerciseTrimp / oneHourFtpTrimp) * 100;
}
