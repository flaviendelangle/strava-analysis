import * as React from "react";

import { InfoIcon } from "lucide-react";

import { Tooltip } from "~/components/primitives/Tooltip";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { NumberField } from "~/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { RiderSettingsTimeline } from "~/sensors/types";

export interface SettingsLayoutProps {
  timeline: RiderSettingsTimeline;
  setTimeline: (t: RiderSettingsTimeline) => void;
  onDeleteAllData: () => Promise<void>;
  deleting: boolean;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
}

export function EquipmentFields({
  timeline,
  setTimeline,
  className,
  showHeader = true,
}: {
  timeline: RiderSettingsTimeline;
  setTimeline: (t: RiderSettingsTimeline) => void;
  className?: string;
  showHeader?: boolean;
}) {
  const updateStatic = (
    field: "cdA" | "crr" | "bikeWeightKg",
    value: number | null,
  ) => {
    setTimeline({ ...timeline, [field]: value ?? 0 });
  };

  return (
    <div className="flex flex-col gap-5">
      {showHeader && (
        <>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                Equipment & Aerodynamics
              </h2>
              <Tooltip label="Only used on the Live Training page to estimate virtual power from speed data. Bike weight affects climbing calculations, CdA (coefficient of drag times frontal area) models air resistance, and Crr (coefficient of rolling resistance) models tire friction.">
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                  <InfoIcon className="size-4" />
                </button>
              </Tooltip>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Used on the Live Training page. These values are constant and do
              not change over time.
            </p>
          </div>
        </>
      )}
      <div className={className ?? "grid grid-cols-1 gap-5 sm:grid-cols-3"}>
      <div className="flex flex-col gap-2">
        <Label>Bike weight (kg)</Label>
        <NumberField
          value={timeline.bikeWeightKg}
          onValueChange={(v) => updateStatic("bikeWeightKg", v)}
          min={0}
          step={0.5}
          smallStep={0.1}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>CdA (drag coefficient x area)</Label>
        <NumberField
          value={timeline.cdA}
          onValueChange={(v) => updateStatic("cdA", v)}
          min={0}
          step={0.01}
          smallStep={0.001}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Crr (rolling resistance)</Label>
        <NumberField
          value={timeline.crr}
          onValueChange={(v) => updateStatic("crr", v)}
          min={0}
          step={0.001}
          smallStep={0.0001}
        />
      </div>
      </div>
    </div>
  );
}

const CYCLING_OPTIONS = [
  { value: "tss", label: "TSS (Power-based)" },
  { value: "hrss", label: "HRSS (Heart Rate-based)" },
] as const;

const RUNNING_OPTIONS = [
  { value: "rtss", label: "rTSS (Pace-based)" },
  { value: "hrss", label: "HRSS (Heart Rate-based)" },
] as const;

const SWIMMING_OPTIONS = [
  { value: "stss", label: "sTSS (Pace-based)" },
  { value: "hrss", label: "HRSS (Heart Rate-based)" },
] as const;

function renderLabel(
  options: readonly { value: string; label: string }[],
): (value: string | null) => string {
  return (value) =>
    options.find((o) => o.value === value)?.label ?? value ?? "";
}

export function LoadAlgorithmFields({
  timeline,
  setTimeline,
  className,
}: {
  timeline: RiderSettingsTimeline;
  setTimeline: (t: RiderSettingsTimeline) => void;
  className?: string;
}) {
  return (
    <div className={className ?? "grid grid-cols-1 gap-5 sm:grid-cols-3"}>
      <div className="flex flex-col gap-2">
        <Label>Cycling</Label>
        <Select
          value={timeline.cyclingLoadAlgorithm}
          onValueChange={(v) =>
            setTimeline({
              ...timeline,
              cyclingLoadAlgorithm: v as "tss" | "hrss",
            })
          }
        >
          <SelectTrigger>
            <SelectValue>{renderLabel(CYCLING_OPTIONS)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CYCLING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Running</Label>
        <Select
          value={timeline.runningLoadAlgorithm}
          onValueChange={(v) =>
            setTimeline({
              ...timeline,
              runningLoadAlgorithm: v as "rtss" | "hrss",
            })
          }
        >
          <SelectTrigger>
            <SelectValue>{renderLabel(RUNNING_OPTIONS)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RUNNING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Swimming</Label>
        <Select
          value={timeline.swimmingLoadAlgorithm}
          onValueChange={(v) =>
            setTimeline({
              ...timeline,
              swimmingLoadAlgorithm: v as "stss" | "hrss",
            })
          }
        >
          <SelectTrigger>
            <SelectValue>{renderLabel(SWIMMING_OPTIONS)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SWIMMING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function DangerZone({
  onDeleteAllData,
  deleting,
  deleteDialogOpen,
  setDeleteDialogOpen,
  variant = "card",
}: {
  onDeleteAllData: () => Promise<void>;
  deleting: boolean;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  variant?: "card" | "inline";
}) {
  const content = (
    <>
      <h2
        className={`text-destructive font-semibold ${variant === "card" ? "mb-2 text-lg" : "mb-1 text-base"}`}
      >
        Danger Zone
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Permanently delete all your activities, streams, settings, and log out.
        This cannot be undone.
      </p>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogTrigger render={<Button variant="destructive" />}>
          Delete all my data
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your activities, settings, and log
              you out. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={onDeleteAllData}
            >
              {deleting ? "Deleting..." : "Delete everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (variant === "inline") {
    return content;
  }

  return (
    <section className="border-destructive/30 bg-card rounded-xl border p-5">
      {content}
    </section>
  );
}
