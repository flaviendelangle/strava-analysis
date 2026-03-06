import { XIcon } from "lucide-react";

import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import { useActivityFilter } from "~/hooks/useActivityFilter";
import { cn } from "~/lib/utils";
import { formatActivityType } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";

const WORKOUT_TYPE_GROUPS: { label: string; types: number[] }[] = [
  { label: "Default", types: [0, 10] },
  { label: "Race", types: [1, 11] },
  { label: "Long Run", types: [2] },
  { label: "Workout", types: [3, 12] },
  { label: "Weight Training", types: [30] },
];

export function ActivityFilterPanel() {
  const { allTypes: activityTypes, allWorkoutTypes: workoutTypes } = useActivitiesQuery();
  const filter = useActivityFilter();

  return (
    <div className="flex flex-col gap-4">
      {/* Sport types */}
      <div>
        <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-medium">
          <span>Sport Types</span>
          {filter.activityTypes.length > 0 && (
            <button
              onClick={() => filter.setActivityTypes([])}
              className="text-muted-foreground hover:text-foreground text-[10px]"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {activityTypes?.map((type) => {
            const Icon = getSportConfig(type).icon;
            const active = filter.activityTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => {
                  const next = active
                    ? filter.activityTypes.filter((t) => t !== type)
                    : [...filter.activityTypes, type];
                  filter.setActivityTypes(next);
                }}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{formatActivityType(type)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workout types */}
      {workoutTypes && workoutTypes.length > 0 && (
        <div>
          <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-medium">
            <span>Workout Type</span>
            {filter.workoutTypes.length > 0 && (
              <button
                onClick={() => filter.setWorkoutTypes([])}
                className="text-muted-foreground hover:text-foreground text-[10px]"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {WORKOUT_TYPE_GROUPS.map((group) => {
              const presentTypes = group.types.filter((t) => workoutTypes.includes(t));
              if (presentTypes.length === 0) return null;
              const active = presentTypes.every((t) => filter.workoutTypes.includes(t));
              return (
                <button
                  key={group.label}
                  onClick={() => {
                    const next = active
                      ? filter.workoutTypes.filter((t) => !presentTypes.includes(t))
                      : [...filter.workoutTypes.filter((t) => !presentTypes.includes(t)), ...presentTypes];
                    filter.setWorkoutTypes(next);
                  }}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span className="truncate">{group.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Date range */}
      <div>
        <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-medium">
          <span>Date Range</span>
          {(filter.dateFrom || filter.dateTo) && (
            <button
              onClick={() => {
                filter.setDateFrom(undefined);
                filter.setDateTo(undefined);
              }}
              className="text-muted-foreground hover:text-foreground text-[10px]"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground w-10 text-xs">From</label>
            <div className="relative flex-1">
              <input
                type="date"
                value={filter.dateFrom ?? ""}
                onChange={(e) => filter.setDateFrom(e.target.value || undefined)}
                className="border-border bg-background h-8 w-full rounded-md border px-2 text-xs"
              />
              {filter.dateFrom && (
                <button
                  onClick={() => filter.setDateFrom(undefined)}
                  className="text-muted-foreground hover:text-foreground absolute right-6 top-1/2 -translate-y-1/2"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground w-10 text-xs">To</label>
            <div className="relative flex-1">
              <input
                type="date"
                value={filter.dateTo ?? ""}
                onChange={(e) => filter.setDateTo(e.target.value || undefined)}
                className="border-border bg-background h-8 w-full rounded-md border px-2 text-xs"
              />
              {filter.dateTo && (
                <button
                  onClick={() => filter.setDateTo(undefined)}
                  className="text-muted-foreground hover:text-foreground absolute right-6 top-1/2 -translate-y-1/2"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
