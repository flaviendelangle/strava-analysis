import * as React from "react";

import { CalendarIcon, SlidersHorizontalIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import { ChangePointsTimeline } from "~/components/settings/ChangePointsTimeline";
import { SettingsStepChart } from "~/components/settings/SettingsStepChart";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { TimePeriodsSettings } from "~/components/settings/TimePeriodsSettings";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { NumberField } from "~/components/ui/number-field";
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
  const { timeline, setTimeline } = useRiderSettingsTimeline();
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

  const updateStatic = (
    field: "cdA" | "crr" | "bikeWeightKg",
    value: number | null,
  ) => {
    setTimeline({ ...timeline, [field]: value ?? 0 });
  };

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
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:gap-6 sm:p-6">
          <section className="border-border bg-card rounded-xl border p-5">
            <ChangePointsTimeline
              timeline={timeline}
              onTimelineChange={setTimeline}
            />
          </section>

          <section className="border-border bg-card rounded-xl border p-5">
            <h3 className="mb-4 text-lg font-semibold">Timeline</h3>
            <SettingsStepChart timeline={timeline} />
          </section>

          <section className="border-border bg-card rounded-xl border p-5">
            <h2 className="mb-2 text-lg font-semibold">
              Equipment & Aerodynamics
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              These values are constant and do not change over time.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>Bike weight (kg)</Label>
                <NumberField
                  value={timeline.bikeWeightKg}
                  onValueChange={(v) => updateStatic("bikeWeightKg", v)}
                  min={0}
                  step={0.5}
                  smallStep={0.1}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>CdA (drag coefficient x area)</Label>
                <NumberField
                  value={timeline.cdA}
                  onValueChange={(v) => updateStatic("cdA", v)}
                  min={0}
                  step={0.01}
                  smallStep={0.001}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Crr (rolling resistance)</Label>
                <NumberField
                  value={timeline.crr}
                  onValueChange={(v) => updateStatic("crr", v)}
                  min={0}
                  step={0.001}
                  smallStep={0.0001}
                />
              </div>
            </div>
          </section>

          <section className="border-destructive/30 bg-card rounded-xl border p-5">
            <h2 className="text-destructive mb-2 text-lg font-semibold">
              Danger Zone
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Permanently delete all your activities, streams, settings, and log
              out. This cannot be undone.
            </p>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger render={<Button variant="destructive" />}>
                Delete all my data
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete all data?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all your activities, settings,
                    and log you out. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleting}
                    onClick={handleDeleteAllData}
                  >
                    {deleting ? "Deleting..." : "Delete everything"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        </div>
      )}
    </>
  );
};

export default SettingsPage;
