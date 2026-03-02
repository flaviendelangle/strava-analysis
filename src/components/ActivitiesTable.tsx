import * as React from "react";

import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import Link from "next/link";
import {
  Row,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import { formatActivityType, formatDuration } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";

import { Doc } from "../../convex/_generated/dataModel";

type Activity = Omit<Doc<"activities">, "mapPolyline">;

function ActivityRow(props: { row: Row<Activity>; index: number }) {
  const { row, index } = props;
  const activityHref = `/activities/${row.original.stravaId}`;

  return (
    <TableRow
      className="relative h-12 data-[odd=true]:bg-secondary data-[odd=true]:hover:bg-accent"
      data-odd={index % 2 === 1}
    >
      {row.getVisibleCells().map((cell, cellIndex) => (
        <TableCell className="px-6" key={cell.id}>
          {cellIndex === 0 ? (
            <Link
              href={activityHref}
              className="after:absolute after:inset-0"
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </Link>
          ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

const columnHelper = createColumnHelper<Activity>();

const columns = [
  columnHelper.accessor("name", {
    cell: (info) => info.getValue(),
    header: () => <span>Title</span>,
  }),
  columnHelper.accessor("startDateLocal", {
    cell: (info) => format(new Date(info.getValue()), "P p", { locale: enGB }),
    header: () => <span>Date</span>,
  }),
  columnHelper.accessor("type", {
    cell: (info) => formatActivityType(info.getValue()),
    header: () => <span>Type</span>,
  }),
  columnHelper.display({
    id: "distance",
    cell: (info) => {
      const activity = info.row.original;
      return activity.distance === 0
        ? ""
        : getSportConfig(activity.type).formatDistance(activity.distance);
    },
    header: () => <span>Distance</span>,
  }),
  columnHelper.accessor("movingTime", {
    cell: (info) => formatDuration(info.getValue()),
    header: () => <span>Moving Time</span>,
    sortingFn: "basic",
  }),
  columnHelper.accessor("hrss", {
    cell: (info) => {
      const value = info.getValue();
      return value == null ? "" : Math.round(value);
    },
    header: () => <span>HRSS</span>,
    sortingFn: "basic",
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
    initialState: {
      sorting: [{ id: "startDateLocal", desc: true }],
    },
  });

  return (
    <Table className="h-full w-full border border-solid border-border text-left text-sm text-muted-foreground">
      <TableHeader className="bg-accent text-xs uppercase text-muted-foreground">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
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
                      asc: <span>&nbsp;&#9650;</span>,
                      desc: <span>&nbsp;&#9660;</span>,
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {activitiesQuery.isLoading
          ? Array.from({ length: 25 }).map((_, index) => (
              <TableRow key={index} className="h-12 odd:bg-secondary">
                {table.getVisibleFlatColumns().map((col) => (
                  <TableCell key={col.id} className="px-6">
                    <div className="h-4 w-32 animate-pulse bg-border" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : table
              .getRowModel()
              .rows.map((row, rowIndex) => (
                <ActivityRow key={row.id} row={row} index={rowIndex} />
              ))}
      </TableBody>
    </Table>
  );
}
