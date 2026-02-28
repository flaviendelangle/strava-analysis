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
    crr = 0.005,
    airDensity = DEFAULT_AIR_DENSITY,
  } = params;

  if (power <= 0) return 0;

  const A = 0.5 * airDensity * cdA;
  const B = crr * riderMassKg * GRAVITY;

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

/**
 * Simulates cycling speed with inertia.
 *
 * Instead of mapping power directly to a steady-state speed, this integrates
 * Newton's second law each tick:
 *   a = (F_pedal - F_drag - F_roll) / m
 *
 * When the rider stops pedaling, speed decays naturally through drag and
 * rolling resistance rather than dropping instantly.
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
      crr = 0.005,
      airDensity = DEFAULT_AIR_DENSITY,
    } = params;

    const v = this.speed;

    // Force from pedaling: P = F * v  =>  F = P / v  (clamped when near-zero)
    const pedalForce = v > 0.5 ? power / v : power / 0.5;

    // Aerodynamic drag: F = 0.5 * rho * CdA * v²
    const dragForce = 0.5 * airDensity * cdA * v * v;

    // Rolling resistance: F = Crr * m * g
    const rollForce = crr * riderMassKg * GRAVITY;

    const netForce = pedalForce - dragForce - rollForce;
    const acceleration = netForce / riderMassKg;

    this.speed = Math.max(0, v + acceleration * dt);
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
