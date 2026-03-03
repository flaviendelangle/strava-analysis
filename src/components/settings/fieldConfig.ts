import type { TimeVaryingField } from "~/sensors/types";

export const RIDER_FIELD_CONFIG: {
  field: TimeVaryingField;
  label: string;
  unit: string;
  min: number;
  step: number;
  smallStep?: number;
}[] = [
  { field: "ftp", label: "FTP", unit: "W", min: 0, step: 1 },
  { field: "weightKg", label: "Weight", unit: "kg", min: 0, step: 1 },
  { field: "restingHr", label: "Resting HR", unit: "bpm", min: 30, step: 1 },
  { field: "maxHr", label: "Max HR", unit: "bpm", min: 100, step: 1 },
  { field: "lthr", label: "LTHR", unit: "bpm", min: 60, step: 1 },
];

export const TIME_VARYING_FIELDS: TimeVaryingField[] = RIDER_FIELD_CONFIG.map(
  (c) => c.field,
);
