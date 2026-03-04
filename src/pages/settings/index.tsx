import * as React from "react";

import { signOut } from "next-auth/react";

import { ChangePointsTimeline } from "~/components/settings/ChangePointsTimeline";
import { SettingsStepChart } from "~/components/settings/SettingsStepChart";
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
import { useAthleteId } from "~/hooks/useAthleteId";
import { useRiderSettingsTimeline } from "~/hooks/useRiderSettings";
import type { NextPageWithLayout } from "~/pages/_app";
import { trpc } from "~/utils/trpc";

const SettingsPage: NextPageWithLayout = () => {
  const { timeline, setTimeline } = useRiderSettingsTimeline();
  const athleteId = useAthleteId();
  const deleteAllData = trpc.account.deleteAllData.useMutation();
  const [deleting, setDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

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

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
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
                  This will permanently delete all your activities, settings, and
                  log you out. This action cannot be undone.
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
    </>
  );
};

export default SettingsPage;
