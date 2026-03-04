const GRAVITY = 9.80665;
const DEFAULT_AIR_DENSITY = 1.225; // kg/m³ at sea level 15°C

interface SpeedFromPowerParams {
  power: number;
  riderMassKg: number;
  cdA?: number;
  crr?: number;
  airDensity?: number;
}

/**
 * Computes realistic cycling speed from power output.
 *
 * For indoor training (slope = 0), the power equation is:
 *   P = 0.5 * rho * CdA * v³ + Crr * m * g * v
 *
 * We solve this cubic equation using Newton-Raphson iteration.
 * Returns speed in m/s.
 */
export function speedFromPower(params: SpeedFromPowerParams): number {
  const {
    power,
    riderMassKg,
    cdA = 0.35,
    crr = 0.004,
    airDensity = DEFAULT_AIR_DENSITY,
  } = params;

  if (power <= 0) return 0;

  const A = 0.5 * airDensity * cdA;
  const B = crr * (riderMassKg + BIKE_MASS_KG) * GRAVITY;

  // f(v)  = A*v³ + B*v - P
  // f'(v) = 3*A*v² + B
  // Initial guess: approximate by ignoring rolling resistance
  let v = Math.cbrt(power / A);

  for (let i = 0; i < 10; i++) {
    const fv = A * v * v * v + B * v - power;
    const fpv = 3 * A * v * v + B;
    const delta = fv / fpv;
    v -= delta;
    if (Math.abs(delta) < 1e-6) break;
  }

  return Math.max(0, v);
}

// Drivetrain efficiency (well-maintained chain)
const DRIVETRAIN_ETA = 0.97;

// Minimum velocity for F = P/v to avoid singularity at v → 0.
// Below this, force is capped as if riding at V_MIN (~3.6 km/h).
const V_MIN = 1.0; // m/s

// Maximum driving force at the rear wheel (N).
// Limits unrealistic acceleration at very low speeds.
// ~500 N corresponds to a strong pedal effort through a typical gear ratio.
const F_DRIVE_MAX = 500;

// Bike mass (kg) — used for total system mass
const BIKE_MASS_KG = 8;

// Wheel rotational inertia: two 700c wheels ≈ 0.12 kg·m² each, r ≈ 0.34 m
// m_eff = m_total + 2·I/r² ≈ m_total + 2.1 kg
const WHEEL_INERTIA_EQUIV_KG = 2.1;

// Number of sub-steps per update call for numerical stability
const SUB_STEPS = 10;

/**
 * Physics-based cycling speed simulator.
 *
 * Based on the Martin et al. (1998) cycling power model:
 *   m_eff · dv/dt = F_drive − F_aero − F_roll
 *
 * Where:
 *   F_drive = min(P · η / max(v, V_MIN), F_MAX)
 *   F_aero  = ½ · ρ · CdA · v²
 *   F_roll  = Crr · m · g
 *   m_eff   = m_rider + m_bike + wheel inertia equivalent
 *
 * Integration uses semi-implicit Euler with sub-stepping for stability.
 */
export class SpeedSimulator {
  private speed = 0; // m/s

  /**
   * Advance the simulation by `dt` seconds with the given instantaneous power.
   * Returns the new speed in m/s.
   */
  update(
    power: number,
    dt: number,
    params: {
      riderMassKg: number;
      cdA?: number;
      crr?: number;
      airDensity?: number;
    },
  ): number {
    const {
      riderMassKg,
      cdA = 0.35,
      crr = 0.004,
      airDensity = DEFAULT_AIR_DENSITY,
    } = params;

    const mTotal = riderMassKg + BIKE_MASS_KG;
    const mEff = mTotal + WHEEL_INERTIA_EQUIV_KG;
    const subDt = dt / SUB_STEPS;

    for (let i = 0; i < SUB_STEPS; i++) {
      const v = this.speed;

      // Driving force: F = P·η / v, clamped at low speed and capped
      const vSafe = Math.max(v, V_MIN);
      const driveForce = Math.min(
        (power * DRIVETRAIN_ETA) / vSafe,
        F_DRIVE_MAX,
      );

      // Aerodynamic drag: F = ½·ρ·CdA·v²
      const dragForce = 0.5 * airDensity * cdA * v * v;

      // Rolling resistance: F = Crr·m·g
      const rollForce = crr * mTotal * GRAVITY;

      const netForce = driveForce - dragForce - rollForce;
      this.speed = Math.max(0, v + (netForce / mEff) * subDt);
    }

    return this.speed;
  }

  reset(): void {
    this.speed = 0;
  }

  getSpeed(): number {
    return this.speed;
  }
}

/** Converts m/s to km/h */
export function msToKmh(ms: number): number {
  return ms * 3.6;
}
