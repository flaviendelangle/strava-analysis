import * as React from "react";

import { Field } from "@base-ui-components/react/field";

import { trpc } from "~/utils/trpc";

import { Select, SelectProps } from "./primitives/Select";

export function ActivityTypeSelect(props: Omit<SelectProps, "options">) {
  const activityTypesQuery = trpc.strava.activityTypes.useQuery();

  const options = React.useMemo<ActivityTypeConfig[]>(() => {
    return (
      activityTypesQuery.data?.map((activityType) => ({
        value: activityType,
        label: activityType,
      })) ?? []
    );
  }, [activityTypesQuery.data]);

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
