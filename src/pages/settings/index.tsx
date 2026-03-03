import * as React from "react";

import { LoadingButton } from "~/components/primitives/LoadingButton";
import { ChangePointsTimeline } from "~/components/settings/ChangePointsTimeline";
import { SettingsStepChart } from "~/components/settings/SettingsStepChart";
import { Label } from "~/components/ui/label";
import { NumberField } from "~/components/ui/number-field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useAthleteId } from "~/hooks/useAthleteId";
import { useRiderSettingsTimeline } from "~/hooks/useRiderSettings";
import type { NextPageWithLayout } from "~/pages/_app";
import { trpc } from "~/utils/trpc";

const SettingsPage: NextPageWithLayout = () => {
  const { timeline, setTimeline } = useRiderSettingsTimeline();
  const athleteId = useAthleteId();
  const recomputeScores = trpc.riderSettings.recomputeScores.useMutation();
  const [recomputing, setRecomputing] = React.useState(false);

  const handleRecomputeScores = React.useCallback(async () => {
    if (!athleteId) return;
    setRecomputing(true);
    try {
      await recomputeScores.mutateAsync({ athleteId });
    } finally {
      setRecomputing(false);
    }
  }, [athleteId, recomputeScores]);

  const updateStatic = (field: "cdA" | "crr" | "bikeWeightKg", value: number | null) => {
    setTimeline({ ...timeline, [field]: value ?? 0 });
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Tooltip>
          <TooltipTrigger
            render={
              <LoadingButton
                loading={recomputing}
                onClick={handleRecomputeScores}
              />
            }
          >
            Recompute all scores
          </TooltipTrigger>
          <TooltipContent>
            Recalculate all activity scores using the current settings
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Unified rider settings table */}
      <section className="rounded-lg bg-card p-4">
        <ChangePointsTimeline
          timeline={timeline}
          onTimelineChange={setTimeline}
        />
      </section>

      {/* Step chart visualization */}
      <section className="rounded-lg bg-card p-4">
        <h3 className="mb-4 text-lg font-medium">Timeline</h3>
        <SettingsStepChart timeline={timeline} />
      </section>

      {/* Static settings */}
      <section className="rounded-lg bg-card p-4">
        <h2 className="mb-4 text-lg font-medium">Equipment & Aerodynamics</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          These values are constant and do not change over time.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Bike weight (kg)</Label>
            <NumberField
              value={timeline.bikeWeightKg}
              onValueChange={(v) => updateStatic("bikeWeightKg", v)}
              min={0}
              step={0.5}
              smallStep={0.1}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>CdA (drag coefficient x area)</Label>
            <NumberField
              value={timeline.cdA}
              onValueChange={(v) => updateStatic("cdA", v)}
              min={0}
              step={0.01}
              smallStep={0.001}
            />
          </div>
          <div className="flex flex-col gap-1.5">
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
    </div>
  );
};

export default SettingsPage;
