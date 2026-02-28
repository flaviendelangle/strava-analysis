export interface HeartRateData {
  heartRate: number;
  rrIntervals?: number[];
  sensorContact?: boolean;
  energyExpended?: number;
}

export interface TrainerData {
  power?: number;
  speed?: number;
  cadence?: number;
  heartRate?: number;
  distance?: number;
  resistanceLevel?: number;
}

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type SensorSource = "ble" | "ant+";

export interface RiderSettings {
  weightKg: number;
  ftp: number;
  cdA: number;
  crr: number;
}

export const DEFAULT_RIDER_SETTINGS: RiderSettings = {
  weightKg: 75,
  ftp: 200,
  cdA: 0.35,
  crr: 0.005,
};

export interface SessionDataPoint {
  timestamp: number;
  elapsed: number;
  power: number | null;
  heartRate: number | null;
  cadence: number | null;
  speed: number | null;
  distance: number;
}

export interface SessionSummary {
  startTime: Date;
  elapsedSeconds: number;
  totalDistance: number;
  avgPower: number | null;
  maxPower: number | null;
  normalizedPower: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgCadence: number | null;
  maxCadence: number | null;
  avgSpeed: number | null;
  maxSpeed: number | null;
}

export interface SensorConnection<T> {
  state: ConnectionState;
  data: T | null;
  deviceName: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const POWER_ZONES = [
  { name: "Recovery", maxPct: 0.55, color: "#808080" },
  { name: "Endurance", maxPct: 0.75, color: "#3B82F6" },
  { name: "Tempo", maxPct: 0.9, color: "#22C55E" },
  { name: "Threshold", maxPct: 1.05, color: "#EAB308" },
  { name: "VO2max", maxPct: 1.2, color: "#F97316" },
  { name: "Anaerobic", maxPct: 1.5, color: "#EF4444" },
  { name: "Neuromuscular", maxPct: Infinity, color: "#9333EA" },
] as const;

export function getPowerZoneColor(power: number, ftp: number): string {
  const pct = power / ftp;
  for (const zone of POWER_ZONES) {
    if (pct < zone.maxPct) return zone.color;
  }
  return POWER_ZONES[POWER_ZONES.length - 1].color;
}
