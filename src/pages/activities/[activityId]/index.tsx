import * as React from "react";

import { z } from "zod";

import { skipToken } from "@tanstack/react-query";

import { ActivityMap } from "~/components/ActivityMap";
import { useTypedParams } from "~/hooks/useTypedParams";
import { NextPageWithLayout } from "~/pages/_app";
import { trpc } from "~/utils/trpc";

const routerSchema = z.object({ activityId: z.string() });

const ActivitiesTablePage: NextPageWithLayout = () => {
  const params = useTypedParams(routerSchema);

  const activityQuery = trpc.strava.activityWithMap.useQuery(
    params == null
      ? skipToken
      : {
          id: Number(params.activityId),
        },
  );

  return (
    <div className="flex h-full w-full flex-col">
      <nav className="border-b border-gray-600 bg-gray-800 p-4 text-white">
        {activityQuery.data?.name ?? "Loading..."}
      </nav>
      <div className="flex h-full w-full">
        <div className="h-full w-1/2">
          {params !== null && (
            <ActivityMap activityId={Number(params.activityId)} />
          )}
        </div>
        <div className="h-full w-1/2"></div>
      </div>
    </div>
  );
};

export default ActivitiesTablePage;
