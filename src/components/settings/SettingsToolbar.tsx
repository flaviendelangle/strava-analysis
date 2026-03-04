import type { ReactNode } from "react";

export function Toolbar({
  children,
  actions,
}: {
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="border-border flex h-16 shrink-0 items-center gap-1.5 border-b px-4">
      {children}
      <div className="min-w-0 flex-1" />
      {actions}
    </div>
  );
}
