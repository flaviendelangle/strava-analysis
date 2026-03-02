import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export function StatCard({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string | number | null;
  tooltip?: ReactNode;
}) {
  const card = (
    <div className="rounded-md bg-gray-800 px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </div>
      <div className="font-mono text-lg font-bold text-white">
        {value ?? "--"}
      </div>
    </div>
  );

  if (!tooltip) return card;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={card} />
        <TooltipContent side="top">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
