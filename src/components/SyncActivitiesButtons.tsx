import * as React from "react";

import { trpc } from "~/utils/trpc";

import { LoadingButton } from "./primitives/LoadingButton";

export function SyncActivitiesButtons() {
  const utils = trpc.useUtils();
  const loadOlderActivitiesMutation =
    trpc.strava.loadOlderActivities.useMutation({
      onSuccess: () => {
        utils.activities.listActivitiesWithoutMap.invalidate();
        utils.activities.listActivitiesWithoutMap.invalidate();
      },
    });
  const checkForNewActivitiesMutation =
    trpc.strava.checkForNewActivities.useMutation({
      onSuccess: () => {
        utils.activities.listActivitiesWithoutMap.invalidate();
        utils.activities.listActivitiesWithoutMap.invalidate();
      },
    });

  return (
    <div className="flex gap-4">
      <LoadingButton
        loading={checkForNewActivitiesMutation.isPending}
        onClick={() => checkForNewActivitiesMutation.mutate()}
      >
        Check for new activities
      </LoadingButton>
      <LoadingButton
        loading={loadOlderActivitiesMutation.isPending}
        onClick={() => loadOlderActivitiesMutation.mutate()}
      >
        Load older activities
      </LoadingButton>
    </div>
  );
}
