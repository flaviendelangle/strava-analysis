import { useMemo, useState } from "react";

import { PlusIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import type {
  RiderSettingsChangePoint,
  RiderSettingsTimeline,
  TimeVaryingField,
} from "~/sensors/types";

import { ChangePointDialog } from "./ChangePointDialog";

const FIELD_COLUMNS: {
  field: TimeVaryingField;
  label: string;
  unit: string;
}[] = [
  { field: "ftp", label: "FTP", unit: "W" },
  { field: "weightKg", label: "Weight", unit: "kg" },
  { field: "restingHr", label: "Resting HR", unit: "bpm" },
  { field: "maxHr", label: "Max HR", unit: "bpm" },
  { field: "lthr", label: "LTHR", unit: "bpm" },
];

const TIME_VARYING_FIELDS: TimeVaryingField[] = FIELD_COLUMNS.map(
  (c) => c.field,
);

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
    const existingIndex = timeline.changes.findIndex(
      (c) => c.id === point.id,
    );
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
        <h3 className="text-lg font-medium">Rider Settings</h3>
        <Button size="sm" onClick={handleAdd}>
          <PlusIcon className="mr-1.5 size-3.5" />
          Add Change
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32" />
            {FIELD_COLUMNS.map(({ field, label, unit }) => (
              <TableHead key={field}>
                {label} ({unit})
              </TableHead>
            ))}
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {resolvedRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-muted-foreground">
                {row.label}
              </TableCell>
              {FIELD_COLUMNS.map(({ field }) => (
                <TableCell
                  key={field}
                  className={cn(
                    "tabular-nums",
                    row.changed.has(field) && "font-semibold text-foreground",
                  )}
                >
                  {row.values[field]}
                </TableCell>
              ))}
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
