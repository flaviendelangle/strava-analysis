import * as React from "react";

import { useQuery } from "convex/react";

import { Field } from "@base-ui/react/field";

import { useAthleteId } from "~/hooks/useAthleteId";

import { api } from "../../convex/_generated/api";
import { Select, SelectProps } from "./primitives/Select";

export function ActivityTypeSelect(props: Omit<SelectProps, "options">) {
  const athleteId = useAthleteId();
  const activityTypes = useQuery(
    api.queries.activityTypes,
    athleteId != null ? { athleteId } : "skip",
  );

  const options = React.useMemo<ActivityTypeConfig[]>(() => {
    return (
      activityTypes?.map((activityType) => ({
        value: activityType,
        label: activityType,
      })) ?? []
    );
  }, [activityTypes]);

  return (
    <Field.Root className="flex w-full items-center justify-between gap-1 align-baseline">
      <Field.Label className="text-sm font-medium text-gray-100">
        Name
      </Field.Label>
      <Select {...props} options={options} />
    </Field.Root>
  );
}

interface ActivityTypeConfig {
  value: string;
  label: string;
}
