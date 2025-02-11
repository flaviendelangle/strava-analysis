import { trpc } from "~/utils/trpc";

import { PrimaryButton } from "./primitives/PrimaryButton";

export function ReloadActivityFromStravaButton(
  props: ReloadActivityFromStravaButtonProps,
) {
  const { id } = props;

  const utils = trpc.useUtils();
  const mutation = trpc.strava.reloadActivity.useMutation({
    onSuccess: () => {
      utils.activities.listActivitiesWithoutMap.invalidate();
      utils.activities.listActivitiesWithMap.invalidate();
      utils.activities.getActivityWithMap.invalidate({ id });
    },
  });

  return (
    <PrimaryButton
      onClick={() =>
        mutation.mutate({
          id,
        })
      }
    >
      Reload from Strava
    </PrimaryButton>
  );
}

interface ReloadActivityFromStravaButtonProps {
  id: number;
}
