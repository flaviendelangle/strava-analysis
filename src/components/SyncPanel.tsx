import * as React from "react";

import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2Icon,
  AlertCircleIcon,
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
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-[3ch] text-right text-xs tabular-nums text-muted-foreground">
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
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 text-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Syncing Strava data...
      </div>

      {/* Activities phase */}
      <div className="flex items-center gap-2">
        {syncJob.activitiesPagesComplete ? (
          <CheckCircle2Icon className="size-3.5 shrink-0 text-green-500" />
        ) : (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        )}
        <span className="text-xs">
          Activities: {syncJob.activitiesFetched} loaded
        </span>
      </div>

      {/* Streams phase */}
      {syncJob.status === "fetching_activities" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
            )}
            <span className="text-xs">
              Streams: {syncJob.streamsFetched} / {syncJob.streamsTotal}
            </span>
          </div>
          {syncJob.streamsTotal > 0 && (
            <div className="pl-[22px]">
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
        className="gap-1.5 text-muted-foreground"
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
        <span className="text-xs text-muted-foreground">
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
