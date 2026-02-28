import * as React from "react";

import { useAction } from "convex/react";

import { useAthleteId } from "~/hooks/useAthleteId";

import { api } from "../../convex/_generated/api";
import { LoadingButton } from "./primitives/LoadingButton";

export function SyncActivitiesButtons() {
  const athleteId = useAthleteId();
  const checkForNew = useAction(api.actions.checkForNewActivities);
  const loadOlder = useAction(api.actions.loadOlderActivities);
  const [isCheckingNew, setIsCheckingNew] = React.useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);

  return (
    <div className="flex gap-4">
      <LoadingButton
        loading={isCheckingNew}
        onClick={async () => {
          if (!athleteId) return;
          setIsCheckingNew(true);
          try {
            await checkForNew({ athleteId });
          } finally {
            setIsCheckingNew(false);
          }
        }}
      >
        Check for new activities
      </LoadingButton>
      <LoadingButton
        loading={isLoadingOlder}
        onClick={async () => {
          if (!athleteId) return;
          setIsLoadingOlder(true);
          try {
            await loadOlder({ athleteId });
          } finally {
            setIsLoadingOlder(false);
          }
        }}
      >
        Load older activities
      </LoadingButton>
    </div>
  );
}
