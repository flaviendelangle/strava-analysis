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
  bikeWeightKg: number;
  restingHr: number;
  maxHr: number;
  lthr: number;
  runThresholdPace: number;
  swimThresholdPace: number;
}

/** Fields that can vary over time */
export type TimeVaryingField =
  | "ftp"
  | "weightKg"
  | "restingHr"
  | "maxHr"
  | "lthr"
  | "runThresholdPace"
  | "swimThresholdPace";

/** A change point recording which fields changed on a given date */
export interface RiderSettingsChangePoint {
  id: string;
  date: string; // "YYYY-MM-DD"
  ftp?: number;
  weightKg?: number;
  restingHr?: number;
  maxHr?: number;
  lthr?: number;
  runThresholdPace?: number;
  swimThresholdPace?: number;
}

/** Full timeline of rider settings persisted to localStorage */
export interface RiderSettingsTimeline {
  cdA: number;
  crr: number;
  bikeWeightKg: number;
  cyclingLoadAlgorithm: "tss" | "hrss";
  runningLoadAlgorithm: "rtss" | "hrss";
  swimmingLoadAlgorithm: "stss" | "hrss";
  initialValues: {
    ftp: number | null;
    weightKg: number | null;
    restingHr: number | null;
    maxHr: number | null;
    lthr: number | null;
    runThresholdPace: number | null;
    swimThresholdPace: number | null;
  };
  changes: RiderSettingsChangePoint[];
}

export const DEFAULT_RIDER_SETTINGS_TIMELINE: RiderSettingsTimeline = {
  cdA: 0.35,
  crr: 0.004,
  bikeWeightKg: 8,
  cyclingLoadAlgorithm: "tss",
  runningLoadAlgorithm: "rtss",
  swimmingLoadAlgorithm: "stss",
  initialValues: {
    ftp: 200,
    weightKg: 75,
    restingHr: 50,
    maxHr: 185,
    lthr: 163,
    runThresholdPace: 3.33,
    swimThresholdPace: 0.952, // ~1:45/100m
  },
  changes: [],
};

// Derived from DEFAULT_RIDER_SETTINGS_TIMELINE — single source of truth
export const DEFAULT_RIDER_SETTINGS: RiderSettings = {
  cdA: DEFAULT_RIDER_SETTINGS_TIMELINE.cdA,
  crr: DEFAULT_RIDER_SETTINGS_TIMELINE.crr,
  bikeWeightKg: DEFAULT_RIDER_SETTINGS_TIMELINE.bikeWeightKg,
  ftp: DEFAULT_RIDER_SETTINGS_TIMELINE.initialValues.ftp!,
  weightKg: DEFAULT_RIDER_SETTINGS_TIMELINE.initialValues.weightKg!,
  restingHr: DEFAULT_RIDER_SETTINGS_TIMELINE.initialValues.restingHr!,
  maxHr: DEFAULT_RIDER_SETTINGS_TIMELINE.initialValues.maxHr!,
  lthr: DEFAULT_RIDER_SETTINGS_TIMELINE.initialValues.lthr!,
  runThresholdPace: DEFAULT_RIDER_SETTINGS_TIMELINE.initialValues.runThresholdPace!,
  swimThresholdPace: DEFAULT_RIDER_SETTINGS_TIMELINE.initialValues.swimThresholdPace!,
};

export interface SessionDataPoint {
  timestamp: number;
  elapsed: number;
  power: number | null;
  targetPower: number | null;
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
  { name: "Neuromuscular", maxPct: Infinity, color: "#DC2626" },
] as const;

export function findPowerZone(
  power: number,
  ftp: number,
): { zone: (typeof POWER_ZONES)[number]; index: number } {
  const pct = power / ftp;
  for (let i = 0; i < POWER_ZONES.length; i++) {
    if (pct < POWER_ZONES[i].maxPct) return { zone: POWER_ZONES[i], index: i };
  }
  return {
    zone: POWER_ZONES[POWER_ZONES.length - 1],
    index: POWER_ZONES.length - 1,
  };
}

export function getPowerZoneColor(power: number, ftp: number): string {
  return findPowerZone(power, ftp).zone.color;
}

export function getPowerZoneName(power: number, ftp: number): string {
  return findPowerZone(power, ftp).zone.name;
}

export function getPowerZoneIndex(power: number, ftp: number): number {
  return findPowerZone(power, ftp).index;
}
