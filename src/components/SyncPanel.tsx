import * as React from "react";

import { useMutation, useQuery } from "convex/react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2,
  RefreshCwIcon,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { useAthleteId } from "~/hooks/useAthleteId";

import { api } from "../../convex/_generated/api";

function ProgressBar(props: { value: number; max: number }) {
  const pct = props.max > 0 ? Math.round((props.value / props.max) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 flex-1 rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground min-w-[3ch] text-right text-xs tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

function SyncProgress(props: {
  syncJob: {
    status: string;
    activitiesFetched: number;
    activitiesPagesComplete: boolean;
    streamsTotal: number;
    streamsFetched: number;
  };
}) {
  const { syncJob } = props;

  return (
    <div className="border-border bg-card flex flex-col gap-2 rounded-md border p-3 text-sm">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        <Loader2 className="size-3 animate-spin" />
        Syncing Strava data...
      </div>

      {/* Activities phase */}
      <div className="flex items-center gap-2">
        {syncJob.activitiesPagesComplete ? (
          <CheckCircle2Icon className="size-3.5 shrink-0 text-green-500" />
        ) : (
          <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
        )}
        <span className="text-xs">
          Activities: {syncJob.activitiesFetched} loaded
        </span>
      </div>

      {/* Streams phase */}
      {syncJob.status === "fetching_activities" && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <div className="size-3.5 shrink-0" />
          <span>Streams: waiting...</span>
        </div>
      )}
      {(syncJob.status === "fetching_streams" ||
        syncJob.status === "computing_scores") && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {syncJob.status === "computing_scores" ? (
              <CheckCircle2Icon className="size-3.5 shrink-0 text-green-500" />
            ) : (
              <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
            )}
            <span className="text-xs">
              Streams: {syncJob.streamsFetched} / {syncJob.streamsTotal}
            </span>
          </div>
          {syncJob.streamsTotal > 0 && (
            <div className="pl-5.5">
              <ProgressBar
                value={syncJob.streamsFetched}
                max={syncJob.streamsTotal}
              />
            </div>
          )}
        </div>
      )}

      {/* Score computation phase */}
      {syncJob.status === "computing_scores" && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 className="size-3.5 shrink-0 animate-spin" />
          <span>Computing training scores...</span>
        </div>
      )}
    </div>
  );
}

export function SyncPanel() {
  const athleteId = useAthleteId();
  const syncJob = useQuery(
    api.queries.getSyncJob,
    athleteId != null ? { athleteId } : "skip",
  );
  const startSync = useMutation(api.mutations.startSync);

  const isInProgress =
    syncJob != null &&
    syncJob.status !== "completed" &&
    syncJob.status !== "failed";

  if (isInProgress) {
    return <SyncProgress syncJob={syncJob} />;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-1.5"
        onClick={async () => {
          if (!athleteId) return;
          await startSync({ athleteId });
        }}
      >
        <RefreshCwIcon className="size-3.5" />
        <span>Sync all data</span>
      </Button>

      {syncJob?.status === "failed" && syncJob.lastError && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircleIcon className="size-3.5" />
          <span>Last sync failed</span>
        </div>
      )}

      {syncJob?.status === "completed" && (
        <span className="text-muted-foreground text-xs">
          Last synced:{" "}
          {new Date(syncJob.startedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}
