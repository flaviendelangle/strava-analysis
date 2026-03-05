import * as React from "react";

import { useSession } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { NumberField } from "~/components/ui/number-field";
import {
  ToolboxTable,
  ToolboxTableBody,
  ToolboxTableCell,
  ToolboxTableHead,
  ToolboxTableHeader,
  ToolboxTableHeaderRow,
  ToolboxTableRow,
} from "~/components/toolbox/ToolboxTable";
import { useRiderSettings } from "~/hooks/useRiderSettings";
import { POWER_ZONES } from "~/sensors/types";

const HR_ZONES = [
  { name: "Zone 1", label: "Recovery", minPct: 0.5, maxPct: 0.6 },
  { name: "Zone 2", label: "Aerobic", minPct: 0.6, maxPct: 0.7 },
  { name: "Zone 3", label: "Tempo", minPct: 0.7, maxPct: 0.8 },
  { name: "Zone 4", label: "Threshold", minPct: 0.8, maxPct: 0.9 },
  { name: "Zone 5", label: "VO2max", minPct: 0.9, maxPct: 1.0 },
] as const;

type Tab = "power" | "heart-rate";

export function ZoneCalculator() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {isLoggedIn ? <ZoneCalculatorLoggedIn /> : <ZoneCalculatorAnonymous />}
    </div>
  );
}

function ZoneCalculatorLoggedIn() {
  const [settings] = useRiderSettings();
  const [tab, setTab] = React.useState<Tab>("heart-rate");
  const [ftp, setFtp] = React.useState<number | null>(settings.ftp);
  const [weightKg, setWeightKg] = React.useState<number | null>(
    settings.weightKg,
  );
  const [maxHr, setMaxHr] = React.useState<number | null>(settings.maxHr);
  const [restingHr, setRestingHr] = React.useState<number | null>(
    settings.restingHr,
  );

  return (
    <ZoneCalculatorInner
      tab={tab}
      setTab={setTab}
      ftp={ftp}
      setFtp={setFtp}
      weightKg={weightKg}
      setWeightKg={setWeightKg}
      maxHr={maxHr}
      setMaxHr={setMaxHr}
      restingHr={restingHr}
      setRestingHr={setRestingHr}
    />
  );
}

function ZoneCalculatorAnonymous() {
  const [tab, setTab] = React.useState<Tab>("heart-rate");
  const [ftp, setFtp] = React.useState<number | null>(200);
  const [weightKg, setWeightKg] = React.useState<number | null>(75);
  const [maxHr, setMaxHr] = React.useState<number | null>(185);
  const [restingHr, setRestingHr] = React.useState<number | null>(50);

  return (
    <ZoneCalculatorInner
      tab={tab}
      setTab={setTab}
      ftp={ftp}
      setFtp={setFtp}
      weightKg={weightKg}
      setWeightKg={setWeightKg}
      maxHr={maxHr}
      setMaxHr={setMaxHr}
      restingHr={restingHr}
      setRestingHr={setRestingHr}
    />
  );
}

function ZoneCalculatorInner({
  tab,
  setTab,
  ftp,
  setFtp,
  weightKg,
  setWeightKg,
  maxHr,
  setMaxHr,
  restingHr,
  setRestingHr,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  ftp: number | null;
  setFtp: (v: number | null) => void;
  weightKg: number | null;
  setWeightKg: (v: number | null) => void;
  maxHr: number | null;
  setMaxHr: (v: number | null) => void;
  restingHr: number | null;
  setRestingHr: (v: number | null) => void;
}) {
  return (
    <>
      {/* Input Card */}
      <div className="bg-card rounded-xl border p-4 md:p-6">
        {/* Tab toggle */}
        <div className="mb-4 flex gap-1.5">
          <Button
            variant={tab === "heart-rate" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("heart-rate")}
          >
            Heart Rate Zones
          </Button>
          <Button
            variant={tab === "power" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("power")}
          >
            Cycling Power Zones
          </Button>
        </div>

        {tab === "power" ? (
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                FTP
              </label>
              <div className="flex items-center gap-1.5">
                <NumberField
                  min={50}
                  max={600}
                  value={ftp}
                  onValueChange={setFtp}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">watts</span>
              </div>
            </div>
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Weight (optional)
              </label>
              <div className="flex items-center gap-1.5">
                <NumberField
                  min={30}
                  max={200}
                  value={weightKg}
                  onValueChange={setWeightKg}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">kg</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Max Heart Rate
              </label>
              <div className="flex items-center gap-1.5">
                <NumberField
                  min={100}
                  max={230}
                  value={maxHr}
                  onValueChange={setMaxHr}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">bpm</span>
              </div>
            </div>
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Resting Heart Rate
              </label>
              <div className="flex items-center gap-1.5">
                <NumberField
                  min={30}
                  max={120}
                  value={restingHr}
                  onValueChange={setRestingHr}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">bpm</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zones Table */}
      {tab === "power" && ftp != null && ftp > 0 && (
        <PowerZonesTable ftp={ftp} weightKg={weightKg} />
      )}
      {tab === "heart-rate" && maxHr != null && maxHr > 0 && (
        <HrZonesTable maxHr={maxHr} restingHr={restingHr ?? 0} />
      )}
    </>
  );
}

function PowerZonesTable({
  ftp,
  weightKg,
}: {
  ftp: number;
  weightKg: number | null;
}) {
  const showWkg = weightKg != null && weightKg > 0;

  return (
    <div className="bg-card rounded-xl border">
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
        <h2 className="text-foreground text-lg font-semibold">
          Power Zones (Coggan)
        </h2>
        <p className="text-muted-foreground text-sm">
          Based on FTP of {ftp}W
          {showWkg && (
            <> — {(ftp / weightKg).toFixed(2)} W/kg</>
          )}
        </p>
      </div>
      <ToolboxTable>
        <ToolboxTableHeader>
          <ToolboxTableHeaderRow>
            <ToolboxTableHead first>Zone</ToolboxTableHead>
            <ToolboxTableHead>Name</ToolboxTableHead>
            <ToolboxTableHead>% FTP</ToolboxTableHead>
            <ToolboxTableHead>Watts</ToolboxTableHead>
            {showWkg && <ToolboxTableHead>W/kg</ToolboxTableHead>}
          </ToolboxTableHeaderRow>
        </ToolboxTableHeader>
        <ToolboxTableBody>
          {POWER_ZONES.map((zone, i) => {
            const prevMax = i === 0 ? 0 : POWER_ZONES[i - 1].maxPct;
            const minW = Math.round(prevMax * ftp);
            const maxW =
              zone.maxPct === Infinity ? null : Math.round(zone.maxPct * ftp);

            const minPctLabel = Math.round(prevMax * 100);
            const maxPctLabel =
              zone.maxPct === Infinity ? null : Math.round(zone.maxPct * 100);

            return (
              <ToolboxTableRow key={zone.name}>
                <ToolboxTableCell first>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-sm"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span>Z{i + 1}</span>
                  </div>
                </ToolboxTableCell>
                <ToolboxTableCell>{zone.name}</ToolboxTableCell>
                <ToolboxTableCell className="text-muted-foreground tabular-nums">
                  {maxPctLabel != null
                    ? `${minPctLabel}–${maxPctLabel}%`
                    : `>${minPctLabel}%`}
                </ToolboxTableCell>
                <ToolboxTableCell className="tabular-nums">
                  {maxW != null ? `${minW}–${maxW}` : `>${minW}`}
                </ToolboxTableCell>
                {showWkg && (
                  <ToolboxTableCell className="text-muted-foreground tabular-nums">
                    {maxW != null
                      ? `${(minW / weightKg).toFixed(1)}–${(maxW / weightKg).toFixed(1)}`
                      : `>${(minW / weightKg).toFixed(1)}`}
                  </ToolboxTableCell>
                )}
              </ToolboxTableRow>
            );
          })}
        </ToolboxTableBody>
      </ToolboxTable>
    </div>
  );
}

function HrZonesTable({
  maxHr,
  restingHr,
}: {
  maxHr: number;
  restingHr: number;
}) {
  // Karvonen formula: target HR = resting + (max - resting) * intensity%
  const hrReserve = maxHr - restingHr;

  return (
    <div className="bg-card rounded-xl border">
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
        <h2 className="text-foreground text-lg font-semibold">
          Heart Rate Zones (Karvonen)
        </h2>
        <p className="text-muted-foreground text-sm">
          Based on max HR of {maxHr} bpm
          {restingHr > 0 && <> and resting HR of {restingHr} bpm</>}
          {" — "}HR reserve: {hrReserve} bpm
        </p>
      </div>
      <ToolboxTable>
        <ToolboxTableHeader>
          <ToolboxTableHeaderRow>
            <ToolboxTableHead first>Zone</ToolboxTableHead>
            <ToolboxTableHead>Name</ToolboxTableHead>
            <ToolboxTableHead>% HRR</ToolboxTableHead>
            <ToolboxTableHead>BPM</ToolboxTableHead>
          </ToolboxTableHeaderRow>
        </ToolboxTableHeader>
        <ToolboxTableBody>
          {HR_ZONES.map((zone) => {
            const minBpm = Math.round(restingHr + hrReserve * zone.minPct);
            const maxBpm = Math.round(restingHr + hrReserve * zone.maxPct);
            const minPctLabel = Math.round(zone.minPct * 100);
            const maxPctLabel = Math.round(zone.maxPct * 100);

            return (
              <ToolboxTableRow key={zone.name}>
                <ToolboxTableCell first>{zone.name}</ToolboxTableCell>
                <ToolboxTableCell>{zone.label}</ToolboxTableCell>
                <ToolboxTableCell className="text-muted-foreground tabular-nums">
                  {minPctLabel}–{maxPctLabel}%
                </ToolboxTableCell>
                <ToolboxTableCell className="tabular-nums">
                  {minBpm}–{maxBpm}
                </ToolboxTableCell>
              </ToolboxTableRow>
            );
          })}
        </ToolboxTableBody>
      </ToolboxTable>
    </div>
  );
}
