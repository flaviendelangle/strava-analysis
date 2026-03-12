import * as React from "react";

import { CalendarIcon, InfoIcon, SlidersHorizontalIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Tooltip } from "~/components/primitives/Tooltip";
import { ResetHintsButton } from "~/components/settings/ResetHintsButton";
import { ChangePointsTimeline } from "~/components/settings/ChangePointsTimeline";
import {
  DangerZone,
  EquipmentFields,
  LoadAlgorithmFields,
} from "~/components/settings/layouts/shared";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { TimePeriodsSettings } from "~/components/settings/TimePeriodsSettings";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useAthleteId } from "~/hooks/useAthleteId";
import { useRiderSettingsTimeline } from "~/hooks/useRiderSettings";
import type { NextPageWithLayout } from "~/pages/_app";
import { trpc } from "~/utils/trpc";

const TABS = [
  { id: "rider", label: "Rider Settings", icon: SlidersHorizontalIcon },
  { id: "periods", label: "Time Periods", icon: CalendarIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SettingsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const rawTab = Array.isArray(router.query.tab) ? router.query.tab[0] : undefined;
  const activeTab = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : undefined;
  const { timeline, setTimeline, hasSettings } = useRiderSettingsTimeline();
  const athleteId = useAthleteId();
  const deleteAllData = trpc.account.deleteAllData.useMutation();
  const [deleting, setDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (router.isReady && !activeTab) {
      void router.replace(`/settings/${TABS[0].id}`);
    }
  }, [router, activeTab]);

  const handleDeleteAllData = React.useCallback(async () => {
    if (!athleteId) return;
    setDeleting(true);
    try {
      await deleteAllData.mutateAsync({ athleteId });
      await signOut({ callbackUrl: "/login" });
    } catch {
      setDeleting(false);
    }
  }, [athleteId, deleteAllData]);

  if (!activeTab) return null;

  return (
    <>
      <Toolbar>
        {/* Mobile: select dropdown */}
        <div className="md:hidden">
          <Select
            value={activeTab}
            onValueChange={(val) => router.push(`/settings/${val}`)}
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
                render={<Link href={`/settings/${tab.id}`} />}
              >
                <Icon className="size-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </Toolbar>

      {activeTab === "periods" ? (
        <TimePeriodsSettings />
      ) : (
        <div className="flex flex-1 flex-col items-center overflow-y-auto p-4 sm:p-6">
          <div className="flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
            <section className="border-border bg-card rounded-xl border p-5">
              <ChangePointsTimeline
                timeline={timeline}
                onTimelineChange={setTimeline}
                hasSettings={hasSettings}
              />
            </section>

            <section className="border-border bg-card rounded-xl border p-5">
              <EquipmentFields
                timeline={timeline}
                setTimeline={setTimeline}
              />
            </section>

            <section className="border-border bg-card rounded-xl border p-5">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-lg font-semibold">Load Algorithm</h2>
                <Tooltip label="TSS uses power data (most accurate for cycling with a power meter). HRSS uses heart rate (works for any sport with an HR monitor). rTSS/sTSS use pace (good for running/swimming without power).">
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                    <InfoIcon className="size-4" />
                  </button>
                </Tooltip>
              </div>
              <p className="text-muted-foreground mb-5 text-sm">
                Choose which training load metric to display for each sport
                category.
              </p>
              <LoadAlgorithmFields
                timeline={timeline}
                setTimeline={setTimeline}
              />
            </section>

            <section className="border-border bg-card rounded-xl border p-5">
              <h2 className="mb-2 text-lg font-semibold">Preferences</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Manage app preferences and onboarding hints.
              </p>
              <ResetHintsButton />
            </section>

            <DangerZone
              onDeleteAllData={handleDeleteAllData}
              deleting={deleting}
              deleteDialogOpen={deleteDialogOpen}
              setDeleteDialogOpen={setDeleteDialogOpen}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPage;
