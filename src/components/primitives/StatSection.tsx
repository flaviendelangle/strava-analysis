import * as React from "react";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import { cn } from "~/lib/utils";

export function StatSection({
  icon: Icon,
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <div>
      <button
        type="button"
        className={cn(
          "text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase",
          collapsible
            ? "hover:text-foreground cursor-pointer transition-colors"
            : "cursor-default",
        )}
        onClick={() => collapsible && setCollapsed((prev) => !prev)}
        disabled={!collapsible}
      >
        <Icon className="size-3.5" />
        <span>{title}</span>
        {collapsible && (
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              !collapsed && "rotate-180",
            )}
          />
        )}
      </button>
      {!collapsed && (
        <div className="grid grid-cols-2 gap-x-2 md:grid-cols-3">
          {children}
        </div>
      )}
    </div>
  );
}
