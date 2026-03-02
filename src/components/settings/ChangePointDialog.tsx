import { useState } from "react";

import { format } from "date-fns";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { NumberField } from "~/components/ui/number-field";
import type {
  RiderSettingsChangePoint,
  TimeVaryingField,
} from "~/sensors/types";

const FIELD_CONFIG: {
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

interface ChangePointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "baseline" | "change";
  existingPoint?: RiderSettingsChangePoint;
  baselineValues?: Record<TimeVaryingField, number>;
  onSave: (point: RiderSettingsChangePoint) => void;
  onSaveBaseline: (values: Record<TimeVaryingField, number>) => void;
  onDelete?: () => void;
}

export function ChangePointDialog({
  open,
  onOpenChange,
  mode,
  existingPoint,
  baselineValues,
  onSave,
  onSaveBaseline,
  onDelete,
}: ChangePointDialogProps) {
  const isBaseline = mode === "baseline";

  const [date, setDate] = useState(
    existingPoint?.date ?? format(new Date(), "yyyy-MM-dd"),
  );
  const [enabledFields, setEnabledFields] = useState<Set<TimeVaryingField>>(
    () => {
      if (!existingPoint) return new Set();
      const fields = new Set<TimeVaryingField>();
      for (const { field } of FIELD_CONFIG) {
        if (existingPoint[field] !== undefined) fields.add(field);
      }
      return fields;
    },
  );
  const [values, setValues] = useState<Record<TimeVaryingField, number>>(
    () => {
      if (baselineValues) return { ...baselineValues };
      return {
        ftp: existingPoint?.ftp ?? 200,
        weightKg: existingPoint?.weightKg ?? 75,
        restingHr: existingPoint?.restingHr ?? 50,
        maxHr: existingPoint?.maxHr ?? 185,
        lthr: existingPoint?.lthr ?? 163,
      };
    },
  );

  const handleSave = () => {
    if (isBaseline) {
      onSaveBaseline(values);
      onOpenChange(false);
      return;
    }

    const point: RiderSettingsChangePoint = {
      id: existingPoint?.id ?? crypto.randomUUID(),
      date,
    };
    for (const { field } of FIELD_CONFIG) {
      if (enabledFields.has(field)) {
        point[field] = values[field];
      }
    }
    onSave(point);
    onOpenChange(false);
  };

  const toggleField = (field: TimeVaryingField) => {
    setEnabledFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isBaseline
              ? "Edit Baseline Values"
              : existingPoint
                ? "Edit Change Point"
                : "Add Change Point"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {!isBaseline && (
            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              />
            </div>
          )}
          {FIELD_CONFIG.map(({ field, label, unit, min, step, smallStep }) => (
            <div key={field} className="flex flex-col gap-1.5">
              {isBaseline ? (
                <Label>
                  {label} ({unit})
                </Label>
              ) : (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={enabledFields.has(field)}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <Label>
                    {label} ({unit})
                  </Label>
                </div>
              )}
              {(isBaseline || enabledFields.has(field)) && (
                <NumberField
                  value={values[field]}
                  onValueChange={(value) =>
                    setValues((prev) => ({ ...prev, [field]: value ?? 0 }))
                  }
                  min={min}
                  step={step}
                  smallStep={smallStep}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          {!isBaseline && existingPoint && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isBaseline && enabledFields.size === 0}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
