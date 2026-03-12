import * as React from "react";

import { format, subDays } from "date-fns";
import { X } from "lucide-react";

import { FeatureHint } from "~/components/primitives/FeatureHint";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { SegmentedToggle } from "~/components/ui/segmented-toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useActivityFilter } from "~/hooks/useActivityFilter";
import { useAthleteId } from "~/hooks/useAthleteId";
import { useRiderSettingsTimeline } from "~/hooks/useRiderSettings";
import { useChartTokens } from "~/lib/chartTokens";
import { trpc } from "~/utils/trpc";

import {
  PowerCurveWebGLChart,
  type PowerCurveMode,
} from "./PowerCurveWebGLChart";
import type { ActivityInfo, PowerCurveSeriesData } from "./types";

// --- Types & constants ---

interface DateRange {
  id: string;
  label: string;
  dateFrom?: string;
  dateTo?: string;
}

// seriesId → (ActivityInfo | null)[] indexed by dataIndex
type ActivityMetadataMap = Record<string, (ActivityInfo | null)[]>;

function makeRollingRange(days: number, label: string): DateRange {
  const now = new Date();
  return {
    id: `preset-${days}d`,
    label,
    dateFrom: subDays(now, days).toISOString(),
    dateTo: now.toISOString(),
  };
}

const PRESET_OPTIONS = [
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "2y", label: "Last 2 years" },
  { value: "all", label: "All time" },
];

function makeYearRange(year: number): DateRange {
  return {
    id: `year-${year}`,
    label: String(year),
    dateFrom: new Date(year, 0, 1).toISOString(),
    dateTo: new Date(year + 1, 0, 1).toISOString(),
  };
}

function presetToRange(preset: string): DateRange {
  switch (preset) {
    case "90d":
      return makeRollingRange(90, "Last 90 days");
    case "1y":
      return makeRollingRange(365, "Last year");
    case "2y":
      return makeRollingRange(730, "Last 2 years");
    case "all":
      return { id: "preset-all", label: "All time" };
    default:
      return makeRollingRange(365, "Last year");
  }
}

const DEFAULT_RANGES: DateRange[] = [presetToRange("1y")];

// --- Props ---

interface PowerCurveProps {
  activityTypes?: string[];
  workoutTypes?: number[];
  stravaId?: number;
}

// --- Component ---

const PowerCurve = React.memo(function PowerCurve({
  activityTypes,
  workoutTypes,
  stravaId,
}: PowerCurveProps) {
  if (stravaId != null) {
    return <SingleActivityPowerCurve stravaId={stravaId} />;
  }

  return <AggregatedPowerCurve activityTypes={activityTypes} workoutTypes={workoutTypes} />;
});

export default PowerCurve;

// --- Single activity mode ---

function SingleActivityPowerCurve({ stravaId }: { stravaId: number }) {
  const tokens = useChartTokens();
  const athleteId = useAthleteId();
  const [showAllTime, setShowAllTime] = React.useState(true);
  const [mode, setMode] = React.useState<PowerCurveMode>("watts");
  const { resolveForDate } = useRiderSettingsTimeline();

  const { data: activity } = trpc.activities.get.useQuery({ stravaId });

  const { data: allTimeBests } = trpc.analytics.getPowerCurve.useQuery(
    {
      athleteId: athleteId!,
      activityTypes: ["Ride", "VirtualRide"],
    },
    { enabled: athleteId != null && showAllTime },
  );

  const activityData = React.useMemo(() => {
    const powerBests = activity?.powerBests;
    if (!powerBests) return null;
    return Object.entries(powerBests)
      .map(([durationStr, watts]) => ({
        duration: Number(durationStr),
        watts: Number(watts),
      }))
      .sort((a, b) => a.duration - b.duration);
  }, [activity?.powerBests]);

  const { xData, series, activityMetadata } = React.useMemo(() => {
    if (!activityData || activityData.length === 0) {
      return { xData: [] as number[], series: [] as PowerCurveSeriesData[], activityMetadata: {} as ActivityMetadataMap };
    }

    const activityByDuration = new Map(activityData.map((d) => [d.duration, d.watts]));

    const allTimeByDuration = new Map(
      (allTimeBests ?? []).map((d) => [
        d.duration,
        { watts: d.watts, activityStravaId: d.activityStravaId, activityName: d.activityName, activityStartDate: d.activityStartDate },
      ]),
    );

    const durationSet = new Set<number>();
    for (const d of activityData) durationSet.add(d.duration);
    if (showAllTime && allTimeBests) {
      for (const d of allTimeBests) durationSet.add(d.duration);
    }
    const durations = [...durationSet].sort((a, b) => a - b);

    const metadata: ActivityMetadataMap = {};

    // Activity weight (single date)
    const activityStartDate = activity?.startDate;
    const activityWeight = activityStartDate
      ? resolveForDate(activityStartDate).weightKg
      : null;

    const chartSeries: PowerCurveSeriesData[] = [
      {
        id: "activity",
        yData: durations.map((d) => activityByDuration.get(d) ?? null),
        label: "This Activity",
        color: tokens.palette[1],
        weights: durations.map(() => activityWeight),
      },
    ];

    if (showAllTime && allTimeBests) {
      const allTimeSeriesId = "all-time";
      metadata[allTimeSeriesId] = durations.map((d) => {
        const entry = allTimeByDuration.get(d);
        if (!entry) return null;
        return { activityStravaId: entry.activityStravaId, activityName: entry.activityName, activityStartDate: entry.activityStartDate };
      });

      chartSeries.push({
        id: allTimeSeriesId,
        yData: durations.map((d) => allTimeByDuration.get(d)?.watts ?? null),
        label: "All-Time Best",
        color: tokens.palette[0],
        weights: durations.map((d) => {
          const entry = allTimeByDuration.get(d);
          if (!entry?.activityStartDate) return null;
          return resolveForDate(entry.activityStartDate).weightKg;
        }),
      });
    }

    return { xData: durations, series: chartSeries, activityMetadata: metadata };
  }, [activityData, allTimeBests, showAllTime, tokens.palette, activity?.startDate, resolveForDate]);

  if (xData.length === 0) {
    return <EmptyChart />;
  }

  return (
    <div className="bg-card flex h-96 w-full flex-col rounded-md">
      <div className="border-border flex items-center gap-1.5 border-b p-2 sm:gap-2 sm:p-4">
        <h3 className="shrink-0 text-xs font-medium sm:text-sm">Cycling Power Curve</h3>
        <FeatureHint hintId="hint-activity-power-curve" title="Power Curve" side="right">
          Your best sustained power efforts at each duration. Toggle &quot;vs All-Time&quot; to compare this activity against your historical bests and spot improvements.
        </FeatureHint>
        <div className="bg-border mx-1 h-4 w-px" />
        <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={showAllTime}
            onChange={(e) => setShowAllTime(e.target.checked)}
            className="accent-primary size-3.5"
          />
          vs All-Time
        </label>
        <div className="flex-1" />
        <ModeToggle mode={mode} onModeChange={setMode} />
      </div>
      <div className="min-h-0 flex-1">
        <PowerCurveWebGLChart xData={xData} series={series} activityMetadata={activityMetadata} mode={mode} />
      </div>
    </div>
  );
}

// --- Aggregated mode with multi-range support ---

function AggregatedPowerCurve({ activityTypes, workoutTypes: workoutTypesProp }: { activityTypes?: string[]; workoutTypes?: number[] }) {
  const tokens = useChartTokens();
  const athleteId = useAthleteId();
  const filter = useActivityFilter();
  const workoutTypes = workoutTypesProp ?? (filter.workoutTypes.length > 0 ? filter.workoutTypes : undefined);
  const [ranges, setRanges] = React.useState<DateRange[]>(DEFAULT_RANGES);
  const [mode, setMode] = React.useState<PowerCurveMode>("watts");
  const { resolveForDate } = useRiderSettingsTimeline();

  const addRange = (range: DateRange) => {
    setRanges((prev) => {
      if (prev.some((r) => r.id === range.id)) return prev;
      return [...prev, range];
    });
  };

  const removeRange = (id: string) => {
    setRanges((prev) => prev.filter((r) => r.id !== id));
  };

  // One query per range
  const queries = trpc.useQueries((t) =>
    ranges.map((range) =>
      t.analytics.getPowerCurve(
        {
          athleteId: athleteId!,
          activityTypes,
          workoutTypes,
          dateFrom: range.dateFrom,
          dateTo: range.dateTo,
        },
        { enabled: athleteId != null },
      ),
    ),
  );

  // Build multi-series chart data
  const { xData, series, activityMetadata } = React.useMemo(() => {
    const allResults = queries.map((q) => q.data ?? []);

    // Union of all durations
    const durationSet = new Set<number>();
    for (const result of allResults) {
      for (const d of result) {
        durationSet.add(d.duration);
      }
    }
    const durations = [...durationSet].sort((a, b) => a - b);

    if (durations.length === 0) {
      return {
        xData: [] as number[],
        series: [] as PowerCurveSeriesData[],
        activityMetadata: {} as ActivityMetadataMap,
      };
    }

    const metadata: ActivityMetadataMap = {};

    const chartSeries: PowerCurveSeriesData[] = allResults.map((data, i) => {
      const seriesId = `range-${i}`;
      const byDuration = new Map(
        data.map((d) => [
          d.duration,
          {
            watts: d.watts,
            activityStravaId: d.activityStravaId,
            activityName: d.activityName,
            activityStartDate: d.activityStartDate,
          },
        ]),
      );

      metadata[seriesId] = durations.map((d) => {
        const entry = byDuration.get(d);
        if (!entry) return null;
        return {
          activityStravaId: entry.activityStravaId,
          activityName: entry.activityName,
          activityStartDate: entry.activityStartDate,
        };
      });

      return {
        id: seriesId,
        yData: durations.map((d) => byDuration.get(d)?.watts ?? null),
        label: ranges[i]?.label ?? `Range ${i + 1}`,
        color: tokens.palette[i % tokens.palette.length],
        weights: durations.map((d) => {
          const entry = byDuration.get(d);
          if (!entry?.activityStartDate) return null;
          return resolveForDate(entry.activityStartDate).weightKg;
        }),
      };
    });

    return {
      xData: durations,
      series: chartSeries,
      activityMetadata: metadata,
    };
  }, [queries, ranges, tokens.palette, resolveForDate]);

  if (xData.length === 0) {
    return (
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        <Toolbar
          ranges={ranges}
          onAddPreset={addRange}
          onAddCustom={addRange}
          onRemove={removeRange}
          athleteId={athleteId}
          activityTypes={activityTypes}
          workoutTypes={workoutTypes}
          mode={mode}
          onModeChange={setMode}
        />
        <div className="text-muted-foreground flex flex-1 items-center justify-center">
          No power data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card flex h-96 w-full flex-col rounded-md">
      <Toolbar
        ranges={ranges}
        onAddPreset={addRange}
        onAddCustom={addRange}
        onRemove={removeRange}
        athleteId={athleteId}
        activityTypes={activityTypes}
        workoutTypes={workoutTypes}
        mode={mode}
        onModeChange={setMode}
      />
      <div className="min-h-0 flex-1">
        <PowerCurveWebGLChart xData={xData} series={series} activityMetadata={activityMetadata} mode={mode} />
      </div>
    </div>
  );
}

// --- Mode Toggle ---

const MODE_OPTIONS: { value: PowerCurveMode; label: string }[] = [
  { value: "watts", label: "W" },
  { value: "wattsPerKg", label: "W/kg" },
];

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: PowerCurveMode;
  onModeChange: (mode: PowerCurveMode) => void;
}) {
  return <SegmentedToggle value={mode} onChange={onModeChange} options={MODE_OPTIONS} />;
}

// --- Toolbar ---

function Toolbar({
  ranges,
  onAddPreset,
  onAddCustom,
  onRemove,
  athleteId,
  activityTypes,
  workoutTypes,
  mode,
  onModeChange,
}: {
  ranges: DateRange[];
  onAddPreset: (range: DateRange) => void;
  onAddCustom: (range: DateRange) => void;
  onRemove: (id: string) => void;
  athleteId: number | null | undefined;
  activityTypes?: string[];
  workoutTypes?: number[];
  mode: PowerCurveMode;
  onModeChange: (mode: PowerCurveMode) => void;
}) {
  const tokens = useChartTokens();
  return (
    <div className="border-border flex flex-wrap items-center gap-1.5 border-b p-2 sm:gap-2 sm:p-4">
      <h3 className="shrink-0 text-xs font-medium sm:text-sm">Cycling Power Curve</h3>
      <div className="bg-border mx-1 h-4 w-px" />
      {ranges.map((range, i) => (
        <RangeChip
          key={range.id}
          range={range}
          color={tokens.palette[i % tokens.palette.length]}
          onRemove={() => onRemove(range.id)}
        />
      ))}
      <PresetSelect
        onSelect={onAddPreset}
        athleteId={athleteId}
        activityTypes={activityTypes}
        workoutTypes={workoutTypes}
      />
      <CustomRangePopover onAdd={onAddCustom} />
      <div className="flex-1" />
      <ModeToggle mode={mode} onModeChange={onModeChange} />
    </div>
  );
}

function RangeChip({
  range,
  color,
  onRemove,
}: {
  range: DateRange;
  color: string;
  onRemove: () => void;
}) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
      <span
        className="inline-block size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {range.label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-foreground/10 rounded-full p-0.5"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function PresetSelect({
  onSelect,
  athleteId,
  activityTypes,
  workoutTypes,
}: {
  onSelect: (range: DateRange) => void;
  athleteId: number | null | undefined;
  activityTypes?: string[];
  workoutTypes?: number[];
}) {
  const { data: years } = trpc.analytics.getPowerCurveYears.useQuery(
    { athleteId: athleteId!, activityTypes, workoutTypes },
    { enabled: athleteId != null },
  );

  return (
    <Select
      value=""
      onValueChange={(v) => {
        if (!v) return;
        if (v.startsWith("year-")) {
          onSelect(makeYearRange(Number(v.slice(5))));
        } else {
          onSelect(presetToRange(v));
        }
      }}
    >
      <SelectTrigger className="text-muted-foreground h-7 min-w-28 border-dashed text-xs">
        <SelectValue placeholder="Add range…" />
      </SelectTrigger>
      <SelectContent>
        {PRESET_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
        {years && years.length > 0 && (
          <>
            <div className="bg-border mx-2 my-1 h-px" />
            {years.map((year) => (
              <SelectItem key={`year-${year}`} value={`year-${year}`}>
                {year}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

function CustomRangePopover({ onAdd }: { onAdd: (range: DateRange) => void }) {
  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const handleAdd = () => {
    if (!from || !to) return;
    const label = `${format(new Date(from), "MMM yyyy")} – ${format(new Date(to), "MMM yyyy")}`;
    onAdd({
      id: `custom-${crypto.randomUUID()}`,
      label,
      dateFrom: new Date(from).toISOString(),
      dateTo: new Date(to).toISOString(),
    });
    setFrom("");
    setTo("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="xs"
            className="text-muted-foreground border-dashed"
          >
            Custom range…
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>From</Label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border-input bg-input/30 h-8 rounded-md border px-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>To</Label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border-input bg-input/30 h-8 rounded-md border px-2 text-sm"
            />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!from || !to}>
            Add range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Shared empty state ---

function EmptyChart() {
  return (
    <div className="bg-card flex h-96 w-full flex-col rounded-md">
      <div className="border-border flex items-center gap-1.5 border-b p-2 sm:gap-2 sm:p-4">
        <h3 className="shrink-0 text-xs font-medium sm:text-sm">Cycling Power Curve</h3>
      </div>
      <div className="text-muted-foreground flex flex-1 items-center justify-center">
        No power data available
      </div>
    </div>
  );
}
