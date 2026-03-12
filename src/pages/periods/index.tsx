import { CalendarIcon, TrashIcon } from "lucide-react";
import Link from "next/link";

import { TimePeriodForm } from "~/components/periods/TimePeriodForm";
import { CardTitle } from "~/components/primitives/CardTitle";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useAthleteId } from "~/hooks/useAthleteId";
import { formatActivityType, formatHumanDuration } from "~/utils/format";
import type { NextPageWithLayout } from "~/pages/_app";
import { trpc } from "~/utils/trpc";

const PeriodsPage: NextPageWithLayout = () => {
  const athleteId = useAthleteId();
  const utils = trpc.useUtils();
  const { data: stats } = trpc.timePeriods.getStats.useQuery(
    { athleteId: athleteId! },
    { enabled: !!athleteId },
  );

  const deleteMutation = trpc.timePeriods.delete.useMutation({
    onSuccess: () => utils.timePeriods.invalidate(),
  });

  return (
    <>
      <Toolbar>
        <CalendarIcon className="size-4" />
        <span className="font-semibold">Time Periods</span>
      </Toolbar>

      <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto p-3 sm:gap-6 sm:p-6">
        <div className="flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
          {/* Create Form */}
          <section className="border-border bg-card rounded-xl border p-5">
            <CardTitle className="mb-4">New Time Period</CardTitle>
            <TimePeriodForm />
          </section>

          {/* Stats Table */}
          {stats && stats.length > 0 ? (
            <section className="border-border bg-card rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Sports
                    </TableHead>
                    <TableHead className="text-right">Activities</TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      Moving Time
                    </TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      Distance
                    </TableHead>
                    <TableHead className="hidden text-right lg:table-cell">
                      Elevation
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((row) => (
                    <TableRow key={row.period.id} className="group">
                      <TableCell className="relative font-medium">
                        <Link
                          href={`/periods/${row.period.id}`}
                          className="text-primary after:absolute after:inset-0"
                        >
                          {row.period.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.period.startDate} &mdash; {row.period.endDate}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                        {row.period.sportTypes
                          ? row.period.sportTypes
                              .map(formatActivityType)
                              .join(", ")
                          : "All"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.activityCount}
                      </TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        {formatHumanDuration(row.totalMovingTime)}
                      </TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        {(row.totalDistance / 1000).toFixed(1)} km
                      </TableCell>
                      <TableCell className="hidden text-right lg:table-cell">
                        {Math.round(row.totalElevation)} m
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="relative z-10 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            if (!athleteId) return;
                            deleteMutation.mutate({
                              athleteId,
                              id: row.period.id,
                            });
                          }}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          ) : (
            <div className="border-border bg-card rounded-xl border p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No time periods yet. Create one above to track training blocks
                and see aggregated statistics.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PeriodsPage;
