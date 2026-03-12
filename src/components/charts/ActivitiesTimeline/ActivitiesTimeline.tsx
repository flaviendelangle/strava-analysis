import * as React from "react";

import { FilterIcon } from "lucide-react";
import { format } from "date-fns";

import { BarChartPro } from "@mui/x-charts-pro";

import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import { useGroupActivitiesByTimeSlice } from "~/hooks/useGroupActivitiesByTimeSlice";
import { useIsMobile } from "~/hooks/useIsMobile";
import { useRiderSettingsTimeline } from "~/hooks/useRiderSettings";
import { SlicePrecision, useTimeSlices } from "~/hooks/useTimeSlices";
import {
  CHART_MARGINS,
  AXIS_SIZE,
  formatCompact,
  useChartTokens,
} from "~/lib/chartTokens";
import { cn } from "~/lib/utils";
import { formatActivityType } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";

import { METRICS, MetricSelect, type MetricContext } from "../../MetricSelect";
import { PrecisionSelect } from "../../PrecisionSelect";
import { ChartThemeProvider } from "../ChartThemeProvider";
import { ChartTooltip } from "../ChartTooltip";

export default function ActivitiesTimeline() {
  const [metric, setMetric] = React.useState("distance");
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const tokens = useChartTokens();
  const isMobile = useIsMobile();
  const [precision, setPrecision] = React.useState<SlicePrecision>("month");
  const activitiesQuery = useActivitiesQuery({ activityTypes: selectedTypes });
  const { timeline } = useRiderSettingsTimeline();

  const metricContext: MetricContext = React.useMemo(
    () => ({
      loadPreferences: {
        cyclingLoadAlgorithm: timeline.cyclingLoadAlgorithm,
        runningLoadAlgorithm: timeline.runningLoadAlgorithm,
        swimmingLoadAlgorithm: timeline.swimmingLoadAlgorithm,
      },
    }),
    [timeline.cyclingLoadAlgorithm, timeline.runningLoadAlgorithm, timeline.swimmingLoadAlgorithm],
  );

  const slices = useTimeSlices({
    precision,
    activities: activitiesQuery.data,
  });

  const groupedActivities = useGroupActivitiesByTimeSlice({
    activities: activitiesQuery.data,
    slices,
    precision,
  });

  const xAxisData = React.useMemo(
    () => groupedActivities.map((group) => group.date),
    [groupedActivities],
  );

  const metricConfig = METRICS.find((el) => el.value === metric);

  const series = React.useMemo(() => {
    if (!metricConfig) {
      return [];
    }

    const activityTypes = new Set<string>();
    activitiesQuery.data?.forEach((activity) => {
      activityTypes.add(activity.type);
    });

    return Array.from(activityTypes).map((activityType) => ({
      label: formatActivityType(activityType),
      data: groupedActivities.map((group) =>
        group.activities.reduce((acc, activity) => {
          if (activity.type === activityType) {
            return metricConfig.getValue(activity, metricContext) + acc;
          }
          return acc;
        }, 0),
      ),
      stack: "total",
    }));
  }, [groupedActivities, metricConfig, activitiesQuery.data]);

  return (
    <ChartThemeProvider>
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        <div className="border-border flex items-center gap-1.5 border-b p-2 sm:gap-4 sm:p-4">
          <h3 className="shrink-0 text-xs font-medium sm:text-sm">Activities Timeline</h3>
          <MetricSelect value={metric} onValueChange={setMetric} />
          <PrecisionSelect value={precision} onValueChange={setPrecision} />
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground ml-auto gap-1.5"
                >
                  <FilterIcon className="size-3.5" />
                  <span>Sport</span>
                  {selectedTypes.length > 0 && (
                    <span className="bg-primary/20 text-primary-foreground rounded px-1 text-xs">
                      {selectedTypes.length}
                    </span>
                  )}
                </Button>
              }
            />
            <PopoverContent align="end" className="w-56 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">Sport Types</span>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => setSelectedTypes([])}
                    className="text-muted-foreground hover:text-foreground text-[10px]"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {activitiesQuery.allTypes?.map((type) => {
                  const Icon = getSportConfig(type).icon;
                  const active = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() =>
                        setSelectedTypes((prev) =>
                          active ? prev.filter((t) => t !== type) : [...prev, type],
                        )
                      }
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
            </PopoverContent>
          </Popover>
        </div>
        <div className="min-h-0 flex-1">
          <BarChartPro
            xAxis={[
              {
                id: "time",
                scaleType: "band",
                data: xAxisData,
                valueFormatter: (value: Date) => format(value, "MM/yyyy"),
                zoom: { filterMode: "discard" },
                height: isMobile ? AXIS_SIZE.mobile.height : AXIS_SIZE.desktop.height,
              },
            ]}
            yAxis={[
              {
                valueFormatter: (value: number) => {
                  if (isMobile) return formatCompact(value);
                  const formatted = Math.round(value).toLocaleString();
                  return metricConfig?.unit
                    ? `${formatted} ${metricConfig.unit}`
                    : formatted;
                },
                width: isMobile ? AXIS_SIZE.mobile.width : AXIS_SIZE.desktop.width,
              },
            ]}
            series={series}
            colors={tokens.palette}
            grid={{ horizontal: true }}
            margin={isMobile ? CHART_MARGINS.standardMobile : CHART_MARGINS.standard}
            hideLegend={isMobile}
            slots={{ tooltip: ChartTooltip }}
          />
        </div>
      </div>
    </ChartThemeProvider>
  );
}
