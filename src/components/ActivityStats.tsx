import * as React from "react";

import {
  Clock,
  Flame,
  Gauge,
  HeartPulse,
  Mountain,
  Route,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";

import type { Activity } from "@server/db/types";

import { StatCard } from "~/components/primitives/StatCard";
import { StatSection } from "~/components/primitives/StatSection";
import { useRiderSettingsTimeline } from "~/hooks/useRiderSettings";
import { cn } from "~/lib/utils";
import { POWER_BEST_ACTIVITY_TYPES } from "~/utils/constants";
import { formatHumanDuration } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";

interface ActivityStatsProps {
  activity: Activity;
}

export const ActivityStats = React.memo(function ActivityStats({
  activity,
}: ActivityStatsProps) {
  const sportConfig = getSportConfig(activity.type);
  const { resolveForDate, hasSettings } = useRiderSettingsTimeline();
  const activityDate = activity.startDateLocal.slice(0, 10);
  const riderSettings = resolveForDate(activityDate);

  const isRide = POWER_BEST_ACTIVITY_TYPES.includes(activity.type);
  const np = activity.weightedAverageWatts ?? null;
  const ftp = riderSettings.ftp;
  const intensityFactor = isRide && np != null ? np / ftp : null;
  const tss = isRide ? (activity.tss ?? null) : null;
  const hrss = activity.hrss ?? null;

  const hasHeartRate = activity.averageHeartrate != null;
  const hasPower = activity.averageWatts != null;
  const hasEnergyCadence =
    activity.kilojoules != null ||
    activity.calories != null ||
    activity.averageCadence != null;
  const hasTrainingLoad =
    intensityFactor != null || tss != null || hrss != null || !hasSettings;
  const hasLoad = hrss != null;

  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <h3 className="mb-4 text-lg font-semibold">Activity Details</h3>

      {/* Hero Row */}
      <div
        className={cn(
          "border-border mb-4 grid gap-2.5 border-b pb-4",
          hasLoad ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3",
        )}
      >
        <StatCard
          icon={Timer}
          label="Moving Time"
          value={formatHumanDuration(activity.movingTime)}
          variant="hero"
        />
        <StatCard
          icon={Route}
          label="Distance"
          value={sportConfig.formatDistance(activity.distance)}
          variant="hero"
        />
        {sportConfig.heroThirdStat === "pace" ? (
          <StatCard
            icon={Gauge}
            label={`Avg ${sportConfig.speedLabel}`}
            value={sportConfig.formatSpeed(activity.averageSpeed)}
            variant="hero"
          />
        ) : (
          <StatCard
            icon={Mountain}
            label="Elevation"
            value={`${activity.totalElevationGain} m`}
            variant="hero"
          />
        )}
        {hasLoad && (
          <StatCard
            icon={TrendingUp}
            label="Load"
            value={Math.round(hrss).toString()}
            variant="hero"
            tooltip="Uses HRSS (Heart Rate Stress Score). Will be configurable per sport in the future."
          />
        )}
      </div>

      {/* Grouped Sections */}
      <div className="flex flex-col gap-4">
        {/* Time & Speed */}
        <StatSection icon={Clock} title={`Time & ${sportConfig.speedLabel}`}>
          <StatCard
            label="Elapsed Time"
            value={formatHumanDuration(activity.elapsedTime)}
          />
          <StatCard
            label={`Avg ${sportConfig.speedLabel}`}
            value={sportConfig.formatSpeed(activity.averageSpeed)}
          />
          {activity.maxSpeed != null && (
            <StatCard
              label={`Max ${sportConfig.speedLabel}`}
              value={sportConfig.formatSpeed(activity.maxSpeed)}
            />
          )}
        </StatSection>

        {/* Heart Rate */}
        {hasHeartRate && (
          <StatSection icon={HeartPulse} title="Heart Rate">
            <StatCard
              label="Avg HR"
              value={`${Math.round(activity.averageHeartrate!)} bpm`}
            />
            {activity.maxHeartrate != null && (
              <StatCard
                label="Max HR"
                value={`${Math.round(activity.maxHeartrate)} bpm`}
              />
            )}
          </StatSection>
        )}

        {/* Power */}
        {hasPower && (
          <StatSection icon={Zap} title="Power">
            <StatCard
              label="Avg Power"
              value={`${Math.round(activity.averageWatts!)} W`}
            />
            {activity.maxWatts != null && (
              <StatCard
                label="Max Power"
                value={`${Math.round(activity.maxWatts)} W`}
              />
            )}
            {np != null && (
              <StatCard
                label="Normalized Power"
                value={`${Math.round(np)} W`}
              />
            )}
          </StatSection>
        )}

        {/* Energy & Cadence */}
        {hasEnergyCadence && (
          <StatSection icon={Flame} title="Energy & Cadence">
            {activity.kilojoules != null && (
              <StatCard
                label="Energy"
                value={`${Math.round(activity.kilojoules)} kJ`}
              />
            )}
            {activity.calories != null && (
              <StatCard
                label="Calories"
                value={`${Math.round(activity.calories)} kcal`}
              />
            )}
            {activity.averageCadence != null && (
              <StatCard
                label="Avg Cadence"
                value={`${Math.round(activity.averageCadence)} ${sportConfig.cadenceUnit}`}
              />
            )}
          </StatSection>
        )}

        {/* Training Load Details (collapsed) */}
        {hasTrainingLoad && (
          <StatSection
            icon={TrendingUp}
            title="Training Load Details"
            collapsible
            defaultCollapsed
          >
            {hasSettings ? (
              <>
                {intensityFactor != null && (
                  <StatCard
                    label="Intensity Factor"
                    value={intensityFactor.toFixed(2)}
                    tooltip={
                      <div className="flex flex-col gap-0.5">
                        <div className="font-medium">
                          Rider settings for {activityDate}
                        </div>
                        <div>FTP: {riderSettings.ftp} W</div>
                      </div>
                    }
                  />
                )}
                {tss != null && (
                  <StatCard
                    label="TSS"
                    value={Math.round(tss).toString()}
                    tooltip={
                      <div className="flex flex-col gap-0.5">
                        <div className="font-medium">
                          Rider settings for {activityDate}
                        </div>
                        <div>FTP: {riderSettings.ftp} W</div>
                      </div>
                    }
                  />
                )}
                {hrss != null && (
                  <StatCard
                    label="HRSS"
                    value={Math.round(hrss).toString()}
                    tooltip={
                      <div className="flex flex-col gap-0.5">
                        <div className="font-medium">
                          Rider settings for {activityDate}
                        </div>
                        <div>Resting HR: {riderSettings.restingHr} bpm</div>
                        <div>Max HR: {riderSettings.maxHr} bpm</div>
                        <div>LTHR: {riderSettings.lthr} bpm</div>
                      </div>
                    }
                  />
                )}
              </>
            ) : (
              <>
                {isRide && (
                  <>
                    <StatCard
                      label="Intensity Factor"
                      value={null}
                      tooltip="Configure your rider settings (FTP) to enable this metric."
                    />
                    <StatCard
                      label="TSS"
                      value={null}
                      tooltip="Configure your rider settings (FTP) to enable this metric."
                    />
                  </>
                )}
                <StatCard
                  label="HRSS"
                  value={null}
                  tooltip="Configure your rider settings (Resting HR, Max HR, LTHR) to enable this metric."
                />
              </>
            )}
          </StatSection>
        )}
      </div>
    </div>
  );
});
