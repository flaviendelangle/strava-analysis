import * as React from "react";

import { BarChartPro } from "@mui/x-charts-pro";

import { Button } from "~/components/ui/button";
import { useAthleteId } from "~/hooks/useAthleteId";
import { useEddingtonData } from "~/hooks/useEddingtonData";
import { trpc } from "~/utils/trpc";

import { ChartThemeProvider } from "../ChartThemeProvider";

const TABS = [
  { label: "Riding", activityTypes: ["Ride", "VirtualRide"] },
  { label: "Running", activityTypes: ["Run"] },
] as const;

const DISTANCE_DIVISOR = 1000;
const UNIT_LABEL = "km";

const DEFAULT_COLOR = "#818cf8"; // indigo-400
const HIGHLIGHT_COLOR = "#f97316"; // orange-500

export default function EddingtonChart() {
  const [activeTab, setActiveTab] = React.useState(0);
  const athleteId = useAthleteId();

  const tab = TABS[activeTab];

  const { data } = trpc.activities.list.useQuery(
    { athleteId: athleteId!, activityTypes: [...tab.activityTypes] },
    { enabled: athleteId != null },
  );

  const eddington = useEddingtonData(data?.activities, DISTANCE_DIVISOR);

  const header = (
    <div className="flex items-center gap-2 border-b border-border p-4">
      <h3 className="text-sm font-medium">Eddington Number</h3>
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
        <div className="flex h-96 w-full flex-col rounded-md bg-secondary">
          {header}
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
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
    d.n === eddington.eddingtonNumber ? HIGHLIGHT_COLOR : DEFAULT_COLOR,
  );

  return (
    <ChartThemeProvider>
      <div className="flex h-96 w-full flex-col rounded-md bg-secondary">
        {header}
        <div className="flex-1">
          <BarChartPro
            xAxis={[
              {
                id: "distance",
                scaleType: "band",
                data: xAxisData,
                label: UNIT_LABEL,
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
                label: "Days",
                valueFormatter: (value: number) =>
                  Math.round(value).toLocaleString(),
              },
            ]}
            series={[
              {
                data: yAxisData,
                label: "Days",
              },
            ]}
            margin={{ left: 72, right: 24 }}
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
