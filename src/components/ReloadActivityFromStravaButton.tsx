import { trpc } from "~/utils/trpc";

import { LoadingButton } from "./primitives/LoadingButton";

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
      utils.activities.getActivityStreams.invalidate({ id });
    },
  });

  return (
    <LoadingButton
      loading={mutation.isPending}
      onClick={() => mutation.mutate({ id })}
    >
      Reload from Strava
    </LoadingButton>
  );
}

interface ReloadActivityFromStravaButtonProps {
  id: number;
}
