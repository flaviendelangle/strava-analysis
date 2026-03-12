import * as React from "react";

import { BarChart3Icon, CalendarIcon, SettingsIcon } from "lucide-react";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";

import { PageIntro } from "~/components/primitives/PageIntro";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { PeriodStatsTable } from "~/components/statistics/PeriodStatsTable";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { NextPageWithLayout } from "~/pages/_app";
import { getActivityTypesByCategory } from "~/utils/sportConfig";

const ActivitiesTimeline = nextDynamic(
  () =>
    import("~/components/charts/ActivitiesTimeline").then(
      (m) => m.ActivitiesTimeline,
    ),
  { ssr: false },
);
const ActivitiesCumulativeTimeline = nextDynamic(
  () =>
    import("~/components/charts/ActivitiesCumulativeTimeline").then(
      (m) => m.ActivitiesCumulativeTimeline,
    ),
  { ssr: false },
);
const PowerCurve = nextDynamic(
  () => import("~/components/charts/PowerCurve").then((m) => m.PowerCurve),
  { ssr: false },
);
const EddingtonChart = nextDynamic(
  () =>
    import("~/components/charts/EddingtonChart").then((m) => m.EddingtonChart),
  { ssr: false },
);

const TABS = [
  { id: "charts", label: "Charts", icon: BarChart3Icon },
  { id: "periods", label: "Time Periods", icon: CalendarIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

const StatisticsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const rawTab = Array.isArray(router.query.tab) ? router.query.tab[0] : undefined;
  const activeTab = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : undefined;

  React.useEffect(() => {
    if (router.isReady && !activeTab) {
      void router.replace(`/statistics/${TABS[0].id}`);
    }
  }, [router, activeTab]);

  if (!activeTab) return null;

  return (
    <>
      <Toolbar>
        {/* Mobile: select dropdown */}
        <div className="md:hidden">
          <Select
            value={activeTab}
            onValueChange={(val) => router.push(`/statistics/${val}`)}
          >
            <SelectTrigger size="sm">
              <SelectValue>
                {(() => {
                  const tab = TABS.find((t) => t.id === activeTab)!;
                  const Icon = tab.icon;
                  return (
                    <>
                      <Icon className="size-4" />
                      {tab.label}
                    </>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <SelectItem key={tab.id} value={tab.id}>
                    <Icon className="size-4" />
                    {tab.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: button tabs */}
        <div className="hidden gap-1 md:flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                className={
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : undefined
                }
                render={<Link href={`/statistics/${tab.id}`} />}
              >
                <Icon className="size-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </Toolbar>

      {activeTab === "charts" ? (
        <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto p-3 sm:p-4">
          <div className="flex w-full max-w-5xl flex-col gap-4">
            <PageIntro hintId="intro-statistics-charts">
              Training volume and intensity trends over time. Configure your rider settings to see training load data in the charts.
            </PageIntro>
            <ActivitiesTimeline />
            <ActivitiesCumulativeTimeline />
            <PowerCurve activityTypes={getActivityTypesByCategory("cycling")} />
            <EddingtonChart />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-4">
          <PageIntro hintId="intro-statistics-periods">
            Compare stats across custom training blocks. Define your time periods in{" "}
            <Link href="/settings/periods" className="text-primary font-medium underline underline-offset-2">
              Settings &gt; Time Periods
            </Link>.
          </PageIntro>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" render={<Link href="/settings/periods" />}>
              <SettingsIcon className="size-4" />
              Manage Periods
            </Button>
          </div>
          <PeriodStatsTable />
        </div>
      )}
    </>
  );
};

export const dynamic = "force-dynamic";

export default StatisticsPage;
