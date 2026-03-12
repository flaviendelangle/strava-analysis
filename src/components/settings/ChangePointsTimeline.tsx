import { useMemo, useState } from "react";

import { BarChart3Icon, InfoIcon, PlusIcon } from "lucide-react";

import { Tooltip } from "~/components/primitives/Tooltip";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import type {
  RiderSettingsChangePoint,
  RiderSettingsTimeline,
  TimeVaryingField,
} from "~/sensors/types";

import { ChangePointDialog } from "./ChangePointDialog";
import { SettingsStepChart } from "./SettingsStepChart";
import { RIDER_FIELD_CONFIG, TIME_VARYING_FIELDS, formatPace } from "./fieldConfig";

interface ResolvedRow {
  id: string;
  label: string;
  values: Record<TimeVaryingField, number>;
  changed: Set<TimeVaryingField>;
  isBaseline: boolean;
}

function buildResolvedRows(timeline: RiderSettingsTimeline): ResolvedRow[] {
  const rows: ResolvedRow[] = [];
  const current = { ...timeline.initialValues };

  rows.push({
    id: "baseline",
    label: "Baseline",
    values: { ...current },
    changed: new Set(TIME_VARYING_FIELDS),
    isBaseline: true,
  });

  for (const change of timeline.changes) {
    const changedFields = new Set<TimeVaryingField>();
    for (const field of TIME_VARYING_FIELDS) {
      if (change[field] !== undefined) {
        current[field] = change[field]!;
        changedFields.add(field);
      }
    }
    rows.push({
      id: change.id,
      label: change.date,
      values: { ...current },
      changed: changedFields,
      isBaseline: false,
    });
  }

  return rows;
}

function formatFieldValue(
  field: (typeof RIDER_FIELD_CONFIG)[number],
  value: number,
): string {
  if (field.inputType === "pace" && field.paceUnit) {
    return formatPace(value, field.paceUnit);
  }
  return `${value}${field.unit}`;
}

interface ChangePointsTimelineProps {
  timeline: RiderSettingsTimeline;
  onTimelineChange: (timeline: RiderSettingsTimeline) => void;
}

export function ChangePointsTimeline({
  timeline,
  onTimelineChange,
}: ChangePointsTimelineProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<
    RiderSettingsChangePoint | undefined
  >();
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);

  const resolvedRows = useMemo(() => buildResolvedRows(timeline), [timeline]);

  const handleAdd = () => {
    setEditingBaseline(false);
    setEditingPoint(undefined);
    setDialogOpen(true);
  };

  const handleEditBaseline = () => {
    setEditingBaseline(true);
    setEditingPoint(undefined);
    setDialogOpen(true);
  };

  const handleEditChange = (point: RiderSettingsChangePoint) => {
    setEditingBaseline(false);
    setEditingPoint(point);
    setDialogOpen(true);
  };

  const handleSave = (point: RiderSettingsChangePoint) => {
    const existingIndex = timeline.changes.findIndex((c) => c.id === point.id);
    let newChanges: RiderSettingsChangePoint[];
    if (existingIndex >= 0) {
      newChanges = [...timeline.changes];
      newChanges[existingIndex] = point;
    } else {
      const sameDateIndex = timeline.changes.findIndex(
        (c) => c.date === point.date,
      );
      if (sameDateIndex >= 0) {
        const merged = { ...timeline.changes[sameDateIndex] };
        for (const field of TIME_VARYING_FIELDS) {
          if (point[field] !== undefined) {
            merged[field] = point[field];
          }
        }
        newChanges = [...timeline.changes];
        newChanges[sameDateIndex] = merged;
      } else {
        newChanges = [...timeline.changes, point];
      }
    }
    onTimelineChange({ ...timeline, changes: newChanges });
  };

  const handleSaveBaseline = (values: Record<TimeVaryingField, number>) => {
    onTimelineChange({ ...timeline, initialValues: values });
  };

  const handleDelete = (id: string) => {
    onTimelineChange({
      ...timeline,
      changes: timeline.changes.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Rider Settings</h3>
          <Tooltip label="Set your baseline fitness values and track how they change over time. These are used to calculate training load and power metrics for your activities.">
            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
              <InfoIcon className="size-4" />
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTimelineDialogOpen(true)}
          >
            <BarChart3Icon className="mr-1.5 size-3.5" />
            Timeline
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <PlusIcon className="mr-1.5 size-3.5" />
            Add Change
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {resolvedRows.map((row) => (
          <div
            key={row.id}
            className="border-border bg-card rounded-lg border px-4 py-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  "text-sm font-medium",
                  row.isBaseline
                    ? "text-foreground"
                    : "text-muted-foreground font-mono",
                )}
              >
                {row.label}
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  if (row.isBaseline) {
                    handleEditBaseline();
                  } else {
                    const point = timeline.changes.find(
                      (c) => c.id === row.id,
                    );
                    if (point) handleEditChange(point);
                  }
                }}
              >
                Edit
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RIDER_FIELD_CONFIG.map((config) => {
                const isChanged = row.changed.has(config.field);
                if (!row.isBaseline && !isChanged) return null;
                return (
                  <span
                    key={config.field}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs",
                      isChanged
                        ? "bg-primary/10 text-primary font-medium"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {config.label}: {formatFieldValue(config, row.values[config.field])}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Settings Timeline</DialogTitle>
          </DialogHeader>
          <SettingsStepChart timeline={timeline} />
        </DialogContent>
      </Dialog>

      <ChangePointDialog
        key={editingBaseline ? "baseline" : (editingPoint?.id ?? "new")}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={editingBaseline ? "baseline" : "change"}
        existingPoint={editingPoint}
        baselineValues={editingBaseline ? timeline.initialValues : undefined}
        onSave={handleSave}
        onSaveBaseline={handleSaveBaseline}
        onDelete={
          editingPoint ? () => handleDelete(editingPoint.id) : undefined
        }
      />
    </div>
  );
}
