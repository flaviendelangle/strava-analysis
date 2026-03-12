import type * as React from "react";

import type { LucideIcon } from "lucide-react";

export function StatSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
        <Icon className="size-3.5" />
        <span>{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 md:grid-cols-3">{children}</div>
    </div>
  );
}
