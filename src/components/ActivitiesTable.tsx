import * as React from "react";

import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import Link from "next/link";

import type { Activity } from "@server/db/types";
import {
  Row,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

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

type ActivityWithoutMap = Omit<Activity, "mapPolyline">;

function ActivityRow(props: {
  row: Row<ActivityWithoutMap>;
  index: number;
  style?: React.CSSProperties;
}) {
  const { row, index, style } = props;
  const activityHref = `/activities/${row.original.stravaId}`;

  return (
    <TableRow
      className="data-[odd=true]:bg-secondary data-[odd=true]:hover:bg-accent relative flex w-full"
      data-odd={index % 2 === 1}
      style={style}
    >
      {row.getVisibleCells().map((cell, cellIndex) => (
        <TableCell
          className="flex min-w-0 items-center px-6"
          style={{ flex: cell.column.getSize() }}
          key={cell.id}
        >
          {cellIndex === 0 ? (
            <Link
              href={activityHref}
              className="truncate after:absolute after:inset-0"
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

const columnHelper = createColumnHelper<ActivityWithoutMap>();

const columns = [
  columnHelper.accessor("name", {
    cell: (info) => info.getValue(),
    header: () => <span>Title</span>,
    size: 3,
  }),
  columnHelper.accessor("startDateLocal", {
    cell: (info) => format(new Date(info.getValue()), "P p", { locale: enGB }),
    header: () => <span>Date</span>,
    size: 2,
  }),
  columnHelper.accessor("type", {
    cell: (info) => formatActivityType(info.getValue()),
    header: () => <span>Type</span>,
    size: 1,
  }),
  columnHelper.accessor("distance", {
    cell: (info) => {
      const activity = info.row.original;
      return activity.distance === 0
        ? ""
        : getSportConfig(activity.type).formatDistance(activity.distance);
    },
    header: () => <span>Distance</span>,
    sortingFn: "basic",
    size: 1,
  }),
  columnHelper.accessor("movingTime", {
    cell: (info) => formatDuration(info.getValue()),
    header: () => <span>Moving Time</span>,
    sortingFn: "basic",
    size: 1,
  }),
  columnHelper.accessor("hrss", {
    cell: (info) => {
      const value = info.getValue();
      return value == null ? "" : Math.round(value);
    },
    header: () => <span>HRSS</span>,
    sortingFn: "basic",
    size: 1,
  }),
];

const ROW_HEIGHT = 48;
const VIRTUALIZER_OVERSCAN = 20;
const SKELETON_ROW_COUNT = 25;

export function ActivitiesTable() {
  const activitiesQuery = useActivitiesQuery();
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

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

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => tableContainerRef.current,
    overscan: VIRTUALIZER_OVERSCAN,
  });

  return (
    <Table
      containerRef={tableContainerRef}
      containerClassName="min-h-0 flex-1"
      className="border-border text-muted-foreground grid border border-solid text-left text-sm"
    >
      <TableHeader className="bg-accent text-muted-foreground sticky top-0 z-10 grid text-xs uppercase">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="flex w-full">
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
                className="flex min-w-0 items-center px-6 py-3"
                style={{ flex: header.column.getSize() }}
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
      <TableBody
        className="relative grid"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {activitiesQuery.isLoading
          ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
              <TableRow key={index} className="odd:bg-secondary flex h-12">
                {table.getVisibleFlatColumns().map((col) => (
                  <TableCell
                    key={col.id}
                    className="flex min-w-0 items-center px-6"
                    style={{ flex: col.getSize() }}
                  >
                    <div className="bg-border h-4 w-32 animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <ActivityRow
                  key={row.id}
                  row={row}
                  index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              );
            })}
      </TableBody>
    </Table>
  );
}
