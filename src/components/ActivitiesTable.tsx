import * as React from "react";

import dayjs from "dayjs";

import {
  Row,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useActivitiesQuery } from "~/hooks/trpc/useActivitiesQuery";
import {
  formatActivityType,
  formatDistance,
  formatDuration,
} from "~/utils/format";
import { RouterOutput } from "~/utils/trpc";

import { ActivityMap } from "./ActivityMap";
import { ReloadActivityFromStravaButton } from "./ReloadActivityFromStravaButton";
import { PrimaryLink } from "./primitives/PrimaryLink";

type Activity = RouterOutput["activities"]["listActivitiesWithoutMap"][number];

function ActivityRow(props: { row: Row<Activity>; index: number }) {
  const { row, index } = props;

  return (
    <React.Fragment>
      <tr
        className="h-12 cursor-pointer select-none hover:bg-gray-600 data-[odd=true]:bg-gray-900 data-[odd=true]:hover:bg-gray-700"
        data-odd={index % 2 === 1}
        onClick={row.getToggleExpandedHandler()}
      >
        {row.getVisibleCells().map((cell) => (
          <td className="px-6" key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
      {row.getIsExpanded() && (
        <tr className="h-96 w-full">
          <td>
            {row.original.map_polyline ? (
              <ActivityMap activity={row.original} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl">
                No map available
              </div>
            )}
          </td>
          <td colSpan={row.getVisibleCells().length - 1} className="px-6">
            <div className="flex gap-4">
              <PrimaryLink href={`/activities/${row.original.id}`}>
                See more details
              </PrimaryLink>
              <ReloadActivityFromStravaButton id={row.original.id} />
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

const columnHelper = createColumnHelper<Activity>();

const columns = [
  columnHelper.accessor("name", {
    cell: (info) => info.getValue(),
    header: () => <span>Title</span>,
  }),
  columnHelper.accessor("startDateLocal", {
    cell: (info) => dayjs(info.getValue()).format("L LT"),
    header: () => <span>Date</span>,
  }),
  columnHelper.accessor("type", {
    cell: (info) => formatActivityType(info.getValue()),
    header: () => <span>Type</span>,
  }),
  columnHelper.accessor("distance", {
    cell: (info) =>
      info.getValue() === 0 ? "" : formatDistance(info.getValue()),
    header: () => <span>Distance</span>,
  }),
  columnHelper.accessor("movingTime", {
    cell: (info) => formatDuration(info.getValue()),
    header: () => <span>Moving Time</span>,
  }),
];

export function ActivitiesTable() {
  const activitiesQuery = useActivitiesQuery();

  const data = React.useMemo(
    () => activitiesQuery.data ?? [],
    [activitiesQuery.data],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
    initialState: {
      sorting: [{ id: "startDateLocal", desc: true }],
    },
  });

  return (
    <table className="h-full w-full border border-solid border-gray-600 text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
      <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                title={
                  header.column.getCanSort()
                    ? header.column.getNextSortingOrder() === "asc"
                      ? "Sort ascending"
                      : header.column.getNextSortingOrder() === "desc"
                        ? "Sort descending"
                        : "Clear sort"
                    : undefined
                }
                className="px-6 py-3"
              >
                {header.isPlaceholder ? null : (
                  <div
                    className="inline-flex items-center data-[sortable=true]:cursor-pointer"
                    data-sortable={header.column.getCanSort()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: <span>&nbsp;▲</span>,
                      desc: <span>&nbsp;▼</span>,
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {activitiesQuery.isLoading
          ? Array.from({ length: 25 }).map((_, index) => (
              <tr key={index} className="h-12 odd:bg-gray-900">
                {table.getVisibleFlatColumns().map((col) => (
                  <td key={col.id} className="px-6">
                    <div className="h-4 w-32 animate-pulse bg-gray-600" />
                  </td>
                ))}
              </tr>
            ))
          : table
              .getRowModel()
              .rows.map((row, rowIndex) => (
                <ActivityRow key={row.id} row={row} index={rowIndex} />
              ))}
      </tbody>
    </table>
  );
}
