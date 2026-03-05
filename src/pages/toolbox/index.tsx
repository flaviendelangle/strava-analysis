import * as React from "react";

import { CogIcon, GaugeIcon, TrendingUpIcon, TimerIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { LoggedInLayout } from "~/components/layouts/LoggedInLayout";
import { SharedLayout } from "~/components/layouts/SharedLayout";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { PaceCalculator } from "~/components/toolbox/PaceCalculator";
import { RacePredictor } from "~/components/toolbox/RacePredictor";
import { GearCalculator } from "~/components/toolbox/GearCalculator";
import { ZoneCalculator } from "~/components/toolbox/ZoneCalculator";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { NextPageWithLayout } from "~/pages/_app";

const TOOLS = [
  { id: "pace-calculator", label: "Pace Calculator", icon: TimerIcon },
  { id: "race-predictor", label: "Race Predictor", icon: TrendingUpIcon },
  { id: "zone-calculator", label: "Zone Calculator", icon: GaugeIcon },
  { id: "gear-calculator", label: "Gear Calculator", icon: CogIcon },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

const ToolboxPage: NextPageWithLayout = () => {
  const [activeTool, setActiveTool] = React.useState<ToolId>("pace-calculator");

  return (
    <>
      <Toolbar>
        {/* Mobile: select dropdown */}
        <div className="md:hidden">
          <Select
            value={activeTool}
            onValueChange={(val) => setActiveTool(val as ToolId)}
          >
            <SelectTrigger size="sm">
              <SelectValue>
                {(() => {
                  const tool = TOOLS.find((t) => t.id === activeTool)!;
                  const Icon = tool.icon;
                  return (
                    <>
                      <Icon className="size-4" />
                      {tool.label}
                    </>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <SelectItem key={tool.id} value={tool.id}>
                    <Icon className="size-4" />
                    {tool.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: button tabs */}
        <div className="hidden gap-1 md:flex">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant="ghost"
                size="sm"
                className={
                  activeTool === tool.id
                    ? "bg-primary/10 text-primary"
                    : undefined
                }
                onClick={() => setActiveTool(tool.id)}
              >
                <Icon className="size-4" />
                {tool.label}
              </Button>
            );
          })}
        </div>
      </Toolbar>
      <div className="flex flex-1 flex-col overflow-auto p-4">
        {activeTool === "pace-calculator" && <PaceCalculator />}
        {activeTool === "race-predictor" && <RacePredictor />}
        {activeTool === "zone-calculator" && <ZoneCalculator />}
        {activeTool === "gear-calculator" && <GearCalculator />}
      </div>
    </>
  );
};

ToolboxPage.getLayout = function getLayout(page) {
  return <ToolboxLayout>{page}</ToolboxLayout>;
};

function ToolboxLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "authenticated") {
    return <LoggedInLayout>{children}</LoggedInLayout>;
  }

  return <SharedLayout>{children}</SharedLayout>;
}

export default ToolboxPage;
