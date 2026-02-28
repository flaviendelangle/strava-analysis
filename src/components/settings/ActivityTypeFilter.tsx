import { useQuery } from "convex/react";
import { useSyncExternalStore } from "react";
import { useCookies } from "react-cookie";

import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { useAthleteId } from "~/hooks/useAthleteId";
import { formatActivityType } from "~/utils/format";

import { api } from "../../../convex/_generated/api";

export function ActivityTypeFilter() {
  const athleteId = useAthleteId();
  const activityTypes = useQuery(
    api.queries.activityTypes,
    athleteId != null ? { athleteId } : "skip",
  );
  const [state, setState] = useCookies(["activity-type"]);

  const currentValues: string[] = state["activity-type"] ?? [];

  const handleCheckedChange = (activityType: string, checked: boolean) => {
    const next = checked
      ? [...currentValues, activityType]
      : currentValues.filter((t: string) => t !== activityType);
    setState("activity-type", next);
  };

  return (
    <div className="flex flex-col gap-2">
      {activityTypes?.map((activityType) => (
        <Label key={activityType}>
          <Checkbox
            checked={currentValues.includes(activityType)}
            onCheckedChange={(checked) =>
              handleCheckedChange(activityType, !!checked)
            }
          />
          {formatActivityType(activityType)}
        </Label>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};
const subscribe = () => noop;
const getServerSnapshot = () => 0;

export function useActivityTypeFilterCount() {
  const [state] = useCookies(["activity-type"]);
  const currentValues: string[] = state["activity-type"] ?? [];

  return useSyncExternalStore(
    subscribe,
    () => currentValues.length,
    getServerSnapshot,
  );
}
