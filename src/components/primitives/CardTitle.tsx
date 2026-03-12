import type { ReactNode } from "react";

import { InfoIcon } from "lucide-react";

import { Tooltip } from "~/components/primitives/Tooltip";
import { cn } from "~/lib/utils";

interface CardTitleProps {
  children: ReactNode;
  tooltip?: string;
  actions?: ReactNode;
  description?: string;
  className?: string;
}

export function CardTitle({
  children,
  tooltip,
  actions,
  description,
  className,
}: CardTitleProps) {
  return (
    <div className={cn(description && "mb-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{children}</h3>
          {tooltip && (
            <Tooltip label={tooltip}>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <InfoIcon className="size-4" />
              </button>
            </Tooltip>
          )}
        </div>
        {actions}
      </div>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}
    </div>
  );
}
