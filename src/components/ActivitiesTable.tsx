import * as React from "react";

import dayjs from "dayjs";
import Link from "next/link";

import { formatDistance, formatDuration } from "~/utils/format";
import { RouterOutput, trpc } from "~/utils/trpc";

import { ActivityMap } from "./ActivityMap";

function ActivityRow(props: {
  activity: RouterOutput["strava"]["activities"][number];
  index: number;
}) {
  const { activity, index } = props;
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <React.Fragment>
      <tr
        className="cursor-pointer select-none hover:bg-gray-600 data-[odd=true]:bg-gray-900 data-[odd=true]:hover:bg-gray-700"
        data-odd={index % 2 === 1}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <th
          className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
          scope="row"
        >
          {activity.name}
        </th>
        <td className="px-6 py-4">
          {dayjs(activity.startDateLocal).format("L LT")}
        </td>
        <td className="px-6 py-4">{activity.type}</td>
        <td className="px-6 py-4">
          {activity.distance === 0 ? "" : formatDistance(activity.distance)}
        </td>
        <td className="px-6 py-4">{formatDuration(activity.movingTime)}</td>
      </tr>
      {isExpanded && (
        <tr className="h-96 w-full">
          <td>
            <ActivityMap activityId={activity.id} />
          </td>
          <td colSpan={4} className="px-6 py-4">
            <Link
              className="inline-flex rounded-md bg-purple-800 px-4 py-2 text-white hover:bg-purple-700"
              href={`/activities/${activity.id}`}
            >
              See more details
            </Link>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

export function ActivitiesTable() {
  const activitiesQuery = trpc.strava.activities.useQuery();

  return (
    <table className="h-full w-full border border-solid border-gray-600 text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
      <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" className="px-6 py-3">
            Name
          </th>
          <th scope="col" className="px-6 py-3">
            Date
          </th>
          <th scope="col" className="px-6 py-3">
            Type
          </th>
          <th scope="col" className="px-6 py-3">
            Distance
          </th>
          <th scope="col" className="px-6 py-3">
            Moving Time
          </th>
        </tr>
      </thead>
      <tbody>
        {activitiesQuery.data
          ? activitiesQuery.data?.map((activity, index) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                index={index}
              />
            ))
          : Array.from({ length: 25 }).map((_, index) => (
              <tr key={index} className="odd:bg-gray-900">
                <td className="px-6 py-4">
                  <div className="h-4 w-48 animate-pulse bg-gray-600" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-32 animate-pulse bg-gray-600" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-32 animate-pulse bg-gray-600" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-32 animate-pulse bg-gray-600" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-32 animate-pulse bg-gray-600" />
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  );
}
