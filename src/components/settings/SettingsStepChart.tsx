import { useMemo, useState } from "react";

import { LineChart } from "@mui/x-charts-pro";
import { format } from "date-fns";

import type {
  RiderSettingsTimeline,
  TimeVaryingField,
} from "~/sensors/types";

import { ChartThemeProvider } from "../charts/ChartThemeProvider";

type Tab = "ftp" | "heartRate" | "weight";

const TABS: { value: Tab; label: string }[] = [
  { value: "ftp", label: "FTP" },
  { value: "heartRate", label: "Heart Rate" },
  { value: "weight", label: "Weight" },
];

const TAB_FIELDS: Record<Tab, TimeVaryingField[]> = {
  ftp: ["ftp"],
  heartRate: ["restingHr", "maxHr", "lthr"],
  weight: ["weightKg"],
};

const FIELD_LABELS: Record<TimeVaryingField, string> = {
  ftp: "FTP (W)",
  weightKg: "Weight (kg)",
  restingHr: "Resting HR",
  maxHr: "Max HR",
  lthr: "LTHR",
};

const COLORS = ["#818cf8", "#34d399", "#fb923c"];

interface SettingsStepChartProps {
  timeline: RiderSettingsTimeline;
}

export function SettingsStepChart({ timeline }: SettingsStepChartProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ftp");
  const fields = TAB_FIELDS[activeTab];

  const chartData = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Collect relevant change dates for active fields
    const changeDates: string[] = [];
    for (const change of timeline.changes) {
      if (fields.some((f) => change[f] !== undefined)) {
        changeDates.push(change.date);
      }
    }

    // Build date points: initial + each change date + today
    const dates: string[] = [];
    if (changeDates.length > 0) {
      // Use 30 days before the first change as the start
      const firstDate = new Date(changeDates[0]);
      firstDate.setDate(firstDate.getDate() - 30);
      dates.push(format(firstDate, "yyyy-MM-dd"));
      for (const d of changeDates) {
        dates.push(d);
      }
      if (dates[dates.length - 1] !== today) {
        dates.push(today);
      }
    } else {
      // No changes — show a flat line from 30 days ago to today
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dates.push(format(thirtyDaysAgo, "yyyy-MM-dd"));
      dates.push(today);
    }

    // For each date, resolve the value of each field
    const seriesData: Record<TimeVaryingField, number[]> = {
      ftp: [],
      weightKg: [],
      restingHr: [],
      maxHr: [],
      lthr: [],
    };

    for (const date of dates) {
      // Resolve each field's value at this date
      const resolved: Record<TimeVaryingField, number> = {
        ...timeline.initialValues,
      };
      for (const change of timeline.changes) {
        if (change.date > date) break;
        for (const f of fields) {
          if (change[f] !== undefined) {
            resolved[f] = change[f]!;
          }
        }
      }
      for (const f of fields) {
        seriesData[f].push(resolved[f]);
      }
    }

    return {
      dates: dates.map((d) => new Date(d)),
      seriesData,
    };
  }, [timeline, fields]);

  const series = fields.map((field, i) => ({
    label: FIELD_LABELS[field],
    data: chartData.seriesData[field],
    curve: "stepAfter" as const,
    showMark: true,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <ChartThemeProvider>
        <div className="h-64 w-full rounded-md bg-secondary">
          <LineChart
            xAxis={[
              {
                id: "date",
                scaleType: "time",
                data: chartData.dates,
                valueFormatter: (value: Date) => format(value, "MMM yyyy"),
              },
            ]}
            yAxis={[
              {
                valueFormatter: (value: number) => Math.round(value).toString(),
              },
            ]}
            series={series}
            margin={{ left: 72, right: 24 }}
          />
        </div>
      </ChartThemeProvider>
    </div>
  );
}
