import * as React from "react";

import { BarChartPro } from "@mui/x-charts-pro";

import { Button } from "~/components/ui/button";
import { useAthleteId } from "~/hooks/useAthleteId";
import { useEddingtonData } from "~/hooks/useEddingtonData";
import { useIsMobile } from "~/hooks/useIsMobile";
import { CHART_MARGINS, AXIS_SIZE, formatCompact, useChartTokens } from "~/lib/chartTokens";
import { trpc } from "~/utils/trpc";

import { ChartThemeProvider } from "../ChartThemeProvider";
import { ChartTooltip } from "../ChartTooltip";

const TABS = [
  { label: "Riding", activityTypes: ["Ride", "VirtualRide"] },
  { label: "Running", activityTypes: ["Run"] },
] as const;

const DISTANCE_DIVISOR = 1000;
const UNIT_LABEL = "km";

export default function EddingtonChart() {
  const [activeTab, setActiveTab] = React.useState(0);
  const tokens = useChartTokens();
  const isMobile = useIsMobile();
  const athleteId = useAthleteId();

  const tab = TABS[activeTab];

  const { data } = trpc.activities.list.useQuery(
    { athleteId: athleteId!, activityTypes: [...tab.activityTypes] },
    { enabled: athleteId != null },
  );

  const eddington = useEddingtonData(data?.activities, DISTANCE_DIVISOR);

  const header = (
    <div className="border-border flex items-center gap-1.5 border-b p-2 sm:gap-2 sm:p-4">
      <h3 className="shrink-0 text-xs font-medium sm:text-sm">Eddington Number</h3>
      {eddington && eddington.eddingtonNumber > 0 && (
        <span className="rounded bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-400">
          E = {eddington.eddingtonNumber}
        </span>
      )}
      <div className="ml-auto flex gap-1">
        {TABS.map((t, i) => (
          <Button
            key={t.label}
            variant={i === activeTab ? "default" : "ghost"}
            size="xs"
            onClick={() => setActiveTab(i)}
          >
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );

  if (!eddington || eddington.data.length === 0) {
    return (
      <ChartThemeProvider>
        <div className="bg-card flex h-96 w-full flex-col rounded-md">
          {header}
          <div className="text-muted-foreground flex flex-1 items-center justify-center">
            No data available
          </div>
        </div>
      </ChartThemeProvider>
    );
  }

  const trimmedData = trimData(eddington.data, eddington.eddingtonNumber);

  const xAxisData = trimmedData.map((d) => d.n);
  const yAxisData = trimmedData.map((d) => d.daysAbove);
  const barColors = trimmedData.map((d) =>
    d.n === eddington.eddingtonNumber ? tokens.palette[5] : tokens.palette[3],
  );

  return (
    <ChartThemeProvider>
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        {header}
        <div className="min-h-0 flex-1">
          <BarChartPro
            xAxis={[
              {
                id: "distance",
                scaleType: "band",
                data: xAxisData,
                label: isMobile ? undefined : UNIT_LABEL,
                height: isMobile ? AXIS_SIZE.mobile.height : AXIS_SIZE.desktop.height,
                valueFormatter: (value: number) => `${value}`,
                colorMap: {
                  type: "ordinal",
                  values: xAxisData,
                  colors: barColors,
                },
              },
            ]}
            yAxis={[
              {
                label: isMobile ? undefined : "Days",
                valueFormatter: (value: number) =>
                  isMobile
                    ? formatCompact(value)
                    : Math.round(value).toLocaleString(),
                width: isMobile ? AXIS_SIZE.mobile.width : AXIS_SIZE.desktop.width,
              },
            ]}
            series={[
              {
                data: yAxisData,
                label: "Days",
              },
            ]}
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

/**
 * Trim data to show a meaningful range around the Eddington number.
 */
function trimData(
  data: { n: number; daysAbove: number }[],
  eddingtonNumber: number,
) {
  // Find the last index with daysAbove > 0
  let lastNonZero = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].daysAbove > 0) {
      lastNonZero = i;
      break;
    }
  }

  const upperBound = Math.max(
    Math.ceil(eddingtonNumber * 1.2),
    lastNonZero + 1,
  );

  return data.slice(0, Math.min(upperBound, data.length));
}
