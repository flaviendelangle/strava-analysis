import * as React from "react";

import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export function Tooltip(props: TooltipProps) {
  const { children, label } = props;
  return (
    <TooltipProvider>
      <ShadTooltip>
        <TooltipTrigger render={children} />
        <TooltipContent side="right">{label}</TooltipContent>
      </ShadTooltip>
    </TooltipProvider>
  );
}

export interface TooltipProps {
  children: React.ReactElement<Record<string, unknown>>;
  label: string;
}
