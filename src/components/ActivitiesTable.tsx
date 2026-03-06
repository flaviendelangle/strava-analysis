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
  getFilteredRowModel,
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
      className="data-[odd=true]:bg-secondary data-[odd=true]:hover:bg-accent relative flex w-full border-0"
      data-odd={index % 2 === 1}
      style={style}
    >
      {row.getVisibleCells().map((cell, cellIndex) => {
        const minWidth = (cell.column.columnDef.meta as any)?.minWidth;
        return (
        <TableCell
          className="flex min-w-0 items-center px-3 md:px-6"
          style={{ flex: cell.column.getSize(), minWidth }}
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
        );
      })}
    </TableRow>
  );
}

const columnHelper = createColumnHelper<ActivityWithoutMap>();

const columns = [
  columnHelper.accessor("type", {
    cell: (info) => {
      const type = info.getValue();
      const Icon = getSportConfig(type).icon;
      return (
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{formatActivityType(type)}</span>
        </span>
      );
    },
    header: () => <span>Sport</span>,
    size: 2,
    meta: { minWidth: 155 },
    filterFn: (row, _columnId, filterValue: string[]) => {
      if (filterValue.length === 0) return true;
      return filterValue.includes(row.getValue("type"));
    },
  }),
  columnHelper.accessor("name", {
    cell: (info) => <span className="truncate">{info.getValue()}</span>,
    header: () => <span>Title</span>,
    size: 3,
    meta: { minWidth: 140 },
    filterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      const name: string = row.getValue("name");
      return name.toLowerCase().includes(filterValue.toLowerCase());
    },
  }),
  columnHelper.accessor("startDateLocal", {
    cell: (info) => <span className="truncate">{format(new Date(info.getValue()), "P p", { locale: enGB })}</span>,
    header: () => <span>Date</span>,
    size: 2,
    meta: { minWidth: 140 },
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
  columnHelper.accessor("totalElevationGain", {
    cell: (info) => {
      const value = info.getValue();
      return value === 0 ? "" : `${Math.round(value)} m`;
    },
    header: () => <span>Elevation</span>,
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

export function ActivitiesTable(props: { nameFilter?: string }) {
  const activitiesQuery = useActivitiesQuery();
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const data = React.useMemo(
    () => activitiesQuery.data ?? [],
    [activitiesQuery.data],
  );

  const columnFilters = React.useMemo(
    () => (props.nameFilter ? [{ id: "name", value: props.nameFilter }] : []),
    [props.nameFilter],
  );

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Table
        containerRef={tableContainerRef}
        containerClassName="border-border min-h-0 flex-1 md:border"
        className="text-muted-foreground grid min-w-[700px] text-left text-sm"
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
                  className="flex min-w-0 items-center px-3 py-3 md:px-6"
                  style={{ flex: header.column.getSize(), minWidth: (header.column.columnDef.meta as any)?.minWidth }}
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
                      className="flex min-w-0 items-center px-3 md:px-6"
                      style={{ flex: col.getSize(), minWidth: (col.columnDef.meta as any)?.minWidth }}
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
    </div>
  );
}
