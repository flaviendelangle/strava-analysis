import * as React from "react";

import { format, subDays } from "date-fns";
import { X } from "lucide-react";
import Link from "next/link";

import {
  LineChart,
  useAxesTooltip,
  useDrawingArea,
  useMouseTracker,
  useSvgRef,
} from "@mui/x-charts-pro";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
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
import { useAthleteId } from "~/hooks/useAthleteId";
import { useIsMobile } from "~/hooks/useIsMobile";
import { CHART_MARGINS, AXIS_SIZE, formatCompact, useChartTokens } from "~/lib/chartTokens";
import { trpc } from "~/utils/trpc";

import { ChartThemeProvider } from "../ChartThemeProvider";

// --- Types & constants ---

interface DateRange {
  id: string;
  label: string;
  dateFrom?: string;
  dateTo?: string;
}

// Colors resolved from tokens at render time — see SingleActivityPowerCurve / AggregatedPowerCurve

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
  stravaId?: number;
}

// --- Helpers ---

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return mins === 0
      ? `${hours}h`
      : `${hours}h${mins.toString().padStart(2, "0")}`;
  }
  return secs === 0
    ? `${mins}min`
    : `${mins}m${secs.toString().padStart(2, "0")}s`;
}

interface ActivityInfo {
  activityStravaId: number;
  activityName: string;
}

// seriesId → (ActivityInfo | null)[] indexed by dataIndex
type ActivityMetadataMap = Record<string, (ActivityInfo | null)[]>;

const ActivityMetadataContext = React.createContext<ActivityMetadataMap>({});

function PowerCurveTooltip() {
  const tooltipData = useAxesTooltip();
  const activityMetadata = React.useContext(ActivityMetadataContext);
  const mousePosition = useMouseTracker();
  const drawingArea = useDrawingArea();
  const svgRef = useSvgRef();

  const [svgTop, setSvgTop] = React.useState(0);
  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    setSvgTop(svg.getBoundingClientRect().top);
  }, [svgRef, mousePosition]);

  if (!tooltipData || !mousePosition) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: mousePosition.x,
        top: svgTop + drawingArea.top,
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <div
        className="bg-popover text-popover-foreground border-border rounded-md border px-3 py-2 shadow-md"
        style={{ pointerEvents: "auto" }}
      >
        {tooltipData.map(
          ({
            axisId,
            axisFormattedValue,
            dataIndex,
            seriesItems,
            mainAxis,
          }) => (
            <div key={axisId}>
              {!mainAxis.hideTooltip && (
                <p className="text-muted-foreground mb-1 text-xs">
                  {axisFormattedValue}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {seriesItems.map(
                  ({ seriesId, color, formattedValue, formattedLabel }) => {
                    if (formattedValue == null) return null;
                    const activity =
                      activityMetadata[seriesId]?.[dataIndex] ?? null;
                    return (
                      <div
                        key={seriesId}
                        className="flex items-center gap-2 text-sm whitespace-nowrap"
                      >
                        <span
                          className="inline-block size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span>{formattedLabel}</span>
                        <span className="font-medium">{formattedValue}</span>
                        {activity && (
                          <Link
                            href={`/activities/${activity.activityStravaId}`}
                            className="text-muted-foreground hover:text-foreground text-xs underline"
                          >
                            {activity.activityName}
                          </Link>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

// --- Component ---

const PowerCurve = React.memo(function PowerCurve({
  activityTypes,
  stravaId,
}: PowerCurveProps) {
  if (stravaId != null) {
    return <SingleActivityPowerCurve stravaId={stravaId} />;
  }

  return <AggregatedPowerCurve activityTypes={activityTypes} />;
});

export default PowerCurve;

// --- Single activity mode (unchanged logic) ---

function SingleActivityPowerCurve({ stravaId }: { stravaId: number }) {
  const tokens = useChartTokens();
  const isMobile = useIsMobile();
  const { data: activity } = trpc.activities.get.useQuery({ stravaId });

  const data = React.useMemo(() => {
    const powerBests = activity?.powerBests;
    if (!powerBests) return null;
    return Object.entries(powerBests)
      .map(([durationStr, watts]) => ({
        duration: Number(durationStr),
        watts: Number(watts),
      }))
      .sort((a, b) => a.duration - b.duration);
  }, [activity?.powerBests]);

  if (!data || data.length === 0) {
    return <EmptyChart />;
  }

  return (
    <ChartThemeProvider>
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        <div className="border-border flex items-center gap-1.5 border-b p-2 sm:gap-2 sm:p-4">
          <h3 className="shrink-0 text-xs font-medium sm:text-sm">Power Curve</h3>
        </div>
        <div className="min-h-0 flex-1">
          <LineChart
            xAxis={[
              {
                scaleType: "log",
                data: data.map((d) => d.duration),
                valueFormatter: (value: number) => formatDuration(value),
                label: isMobile ? undefined : "Duration",
                height: isMobile ? AXIS_SIZE.mobile.height : AXIS_SIZE.desktop.height,
              },
            ]}
            yAxis={[
              {
                label: isMobile ? undefined : "Watts",
                valueFormatter: (value: number) =>
                  isMobile ? formatCompact(value) : `${Math.round(value)} W`,
                width: isMobile ? AXIS_SIZE.mobile.width : AXIS_SIZE.desktop.width,
              },
            ]}
            series={[
              {
                data: data.map((d) => d.watts),
                showMark: false,
                color: tokens.palette[1],
                curve: "monotoneX",
                label: "Max Average Power",
              },
            ]}
            grid={{ horizontal: true }}
            margin={isMobile ? CHART_MARGINS.standardMobile : CHART_MARGINS.standard}
            hideLegend={isMobile}
          />
        </div>
      </div>
    </ChartThemeProvider>
  );
}

// --- Aggregated mode with multi-range support ---

function AggregatedPowerCurve({ activityTypes }: { activityTypes?: string[] }) {
  const tokens = useChartTokens();
  const isMobile = useIsMobile();
  const athleteId = useAthleteId();
  const [ranges, setRanges] = React.useState<DateRange[]>(DEFAULT_RANGES);

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
        series: [] as any[],
        activityMetadata: {} as ActivityMetadataMap,
      };
    }

    const metadata: ActivityMetadataMap = {};

    const chartSeries = allResults.map((data, i) => {
      const seriesId = `range-${i}`;
      const byDuration = new Map(
        data.map((d) => [
          d.duration,
          {
            watts: d.watts,
            activityStravaId: d.activityStravaId,
            activityName: d.activityName,
          },
        ]),
      );

      metadata[seriesId] = durations.map((d) => {
        const entry = byDuration.get(d);
        if (!entry) return null;
        return {
          activityStravaId: entry.activityStravaId,
          activityName: entry.activityName,
        };
      });

      return {
        id: seriesId,
        data: durations.map((d) => byDuration.get(d)?.watts ?? null),
        label: ranges[i]?.label ?? `Range ${i + 1}`,
        color: tokens.palette[i % tokens.palette.length],
        showMark: false,
        curve: "monotoneX" as const,
      };
    });

    return {
      xData: durations,
      series: chartSeries,
      activityMetadata: metadata,
    };
  }, [queries, ranges]);

  if (xData.length === 0) {
    return (
      <ChartThemeProvider>
        <div className="bg-card flex h-96 w-full flex-col rounded-md">
          <Toolbar
            ranges={ranges}
            onAddPreset={addRange}
            onAddCustom={addRange}
            onRemove={removeRange}
            athleteId={athleteId}
            activityTypes={activityTypes}
          />
          <div className="text-muted-foreground flex flex-1 items-center justify-center">
            No power data available
          </div>
        </div>
      </ChartThemeProvider>
    );
  }

  return (
    <ChartThemeProvider>
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        <Toolbar
          ranges={ranges}
          onAddPreset={addRange}
          onAddCustom={addRange}
          onRemove={removeRange}
          athleteId={athleteId}
          activityTypes={activityTypes}
        />
        <div className="min-h-0 flex-1">
          <ActivityMetadataContext.Provider value={activityMetadata}>
            <LineChart
              xAxis={[
                {
                  scaleType: "log",
                  data: xData,
                  valueFormatter: (value: number) => formatDuration(value),
                  label: isMobile ? undefined : "Duration",
                  height: isMobile ? AXIS_SIZE.mobile.height : AXIS_SIZE.desktop.height,
                },
              ]}
              yAxis={[
                {
                  label: isMobile ? undefined : "Watts",
                  valueFormatter: (value: number) =>
                    isMobile ? formatCompact(value) : `${Math.round(value)} W`,
                  width: isMobile ? AXIS_SIZE.mobile.width : AXIS_SIZE.desktop.width,
                },
              ]}
              series={series}
              grid={{ horizontal: true }}
              margin={isMobile ? CHART_MARGINS.standardMobile : CHART_MARGINS.standard}
              hideLegend={isMobile}
              slots={{ tooltip: PowerCurveTooltip }}
            />
          </ActivityMetadataContext.Provider>
        </div>
      </div>
    </ChartThemeProvider>
  );
}

// --- Toolbar ---

function Toolbar({
  ranges,
  onAddPreset,
  onAddCustom,
  onRemove,
  athleteId,
  activityTypes,
}: {
  ranges: DateRange[];
  onAddPreset: (range: DateRange) => void;
  onAddCustom: (range: DateRange) => void;
  onRemove: (id: string) => void;
  athleteId: number | null | undefined;
  activityTypes?: string[];
}) {
  const tokens = useChartTokens();
  return (
    <div className="border-border flex flex-wrap items-center gap-1.5 border-b p-2 sm:gap-2 sm:p-4">
      <h3 className="shrink-0 text-xs font-medium sm:text-sm">Power Curve</h3>
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
      />
      <CustomRangePopover onAdd={onAddCustom} />
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
}: {
  onSelect: (range: DateRange) => void;
  athleteId: number | null | undefined;
  activityTypes?: string[];
}) {
  const { data: years } = trpc.analytics.getPowerCurveYears.useQuery(
    { athleteId: athleteId!, activityTypes },
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
  const counterRef = React.useRef(0);

  const handleAdd = () => {
    if (!from || !to) return;
    const label = `${format(new Date(from), "MMM yyyy")} – ${format(new Date(to), "MMM yyyy")}`;
    onAdd({
      id: `custom-${counterRef.current++}`,
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
    <ChartThemeProvider>
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        <div className="border-border flex items-center gap-1.5 border-b p-2 sm:gap-2 sm:p-4">
          <h3 className="shrink-0 text-xs font-medium sm:text-sm">Power Curve</h3>
        </div>
        <div className="text-muted-foreground flex flex-1 items-center justify-center">
          No power data available
        </div>
      </div>
    </ChartThemeProvider>
  );
}
