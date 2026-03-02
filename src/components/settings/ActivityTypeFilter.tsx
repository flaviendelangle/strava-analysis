import { useCookies } from "react-cookie";

import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import { formatActivityType } from "~/utils/format";

export function ActivityTypeFilter() {
  const { allTypes: activityTypes } = useActivitiesQuery();
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

export function useActivityTypeFilterCount() {
  const [state] = useCookies(["activity-type"]);
  const currentValues: string[] = state["activity-type"] ?? [];

  return currentValues.length;
}
