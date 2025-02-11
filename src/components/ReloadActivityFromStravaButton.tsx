import { trpc } from "~/utils/trpc";

import { PrimaryButton } from "./primitives/PrimaryButton";

export function ReloadActivityFromStravaButton(
  props: ReloadActivityFromStravaButtonProps,
) {
  const { id } = props;

  const utils = trpc.useUtils();
  const mutation = trpc.strava.reloadActivityFromStrava.useMutation({
    onSuccess: () => utils.strava.activities.invalidate(),
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
