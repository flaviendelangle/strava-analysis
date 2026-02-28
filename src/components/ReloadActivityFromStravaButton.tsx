import * as React from "react";

import { useAction } from "convex/react";

import { useAthleteId } from "~/hooks/useAthleteId";

import { api } from "../../convex/_generated/api";
import { LoadingButton } from "./primitives/LoadingButton";

export function ReloadActivityFromStravaButton(
  props: ReloadActivityFromStravaButtonProps,
) {
  const { stravaId } = props;
  const athleteId = useAthleteId();
  const reloadActivity = useAction(api.actions.reloadActivity);
  const [loading, setLoading] = React.useState(false);

  return (
    <LoadingButton
      loading={loading}
      onClick={async () => {
        if (!athleteId) return;
        setLoading(true);
        try {
          await reloadActivity({ stravaId, athleteId });
        } finally {
          setLoading(false);
        }
      }}
    >
      Reload from Strava
    </LoadingButton>
  );
}

interface ReloadActivityFromStravaButtonProps {
  stravaId: number;
}
