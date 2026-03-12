import * as React from "react";

import { FilterIcon } from "lucide-react";
import { format, getMonth, getYear } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

import { LineChart } from "@mui/x-charts-pro";

import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import {
  GroupedActivities,
  useGroupActivitiesByTimeSlice,
} from "~/hooks/useGroupActivitiesByTimeSlice";
import { useIsMobile } from "~/hooks/useIsMobile";
import { useRiderSettingsTimeline } from "~/hooks/useRiderSettings";
import { useTimeSlices } from "~/hooks/useTimeSlices";
import { CHART_MARGINS, AXIS_SIZE, formatCompact, useChartTokens } from "~/lib/chartTokens";
import { cn } from "~/lib/utils";
import { formatActivityType } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";

import { METRICS, MetricSelect, type MetricContext } from "../../MetricSelect";
import { ChartThemeProvider } from "../ChartThemeProvider";
import { ChartTooltip } from "../ChartTooltip";

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2024, i, 1), "MMMM", { locale: enGB }),
);

export default function ActivitiesCumulativeTimeline() {
  const [metric, setMetric] = React.useState("distance");
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const tokens = useChartTokens();
  const isMobile = useIsMobile();
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
    precision: "month",
    activities: activitiesQuery.data,
  });

  const groupedActivities = useGroupActivitiesByTimeSlice({
    activities: activitiesQuery.data,
    slices,
    precision: "month",
  });

  const metricConfig = METRICS.find((el) => el.value === metric);

  const series = React.useMemo(() => {
    if (!metricConfig) {
      return [];
    }

    const groupedPerYearActivities = groupedActivities.reduce(
      (acc, group) => {
        const year = getYear(group.date);
        if (!acc[year]) {
          acc[year] = [];
        }

        acc[year].push(group);

        return acc;
      },
      {} as Record<string, GroupedActivities>,
    );

    const years = Object.keys(groupedPerYearActivities).sort();

    return years.map((year) => {
      const monthlyData = new Array(12).fill(0);
      groupedPerYearActivities[year].forEach((group) => {
        const monthIndex = getMonth(group.date);
        monthlyData[monthIndex] = group.activities.reduce(
          (acc, activity) => metricConfig.getValue(activity, metricContext) + acc,
          0,
        );
      });

      // Accumulate: each month = sum of all months up to and including it
      for (let i = 1; i < 12; i++) {
        monthlyData[i] += monthlyData[i - 1];
      }

      return {
        label: year,
        data: monthlyData,
        showMark: false,
        curve: "natural" as const,
      };
    });
  }, [groupedActivities, metricConfig]);

  return (
    <ChartThemeProvider>
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        <div className="border-border flex items-center gap-1.5 border-b p-2 sm:gap-4 sm:p-4">
          <h3 className="shrink-0 text-xs font-medium sm:text-sm">Year-over-Year Progress</h3>
          <MetricSelect value={metric} onValueChange={setMetric} />
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
          <LineChart
            xAxis={[
              {
                scaleType: "band",
                data: MONTH_LABELS,
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
