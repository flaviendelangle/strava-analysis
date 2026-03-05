import * as React from "react";

import {
  Table as BaseTable,
  TableBody as BaseTableBody,
  TableCell as BaseTableCell,
  TableHead as BaseTableHead,
  TableHeader as BaseTableHeader,
  TableRow as BaseTableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";

/**
 * Thin wrappers around ui/table primitives with consistent toolbox styling:
 * - Header row: no hover
 * - First column (head + cell): extra left padding
 */

function ToolboxTable(
  props: React.ComponentProps<typeof BaseTable>,
) {
  return <BaseTable {...props} />;
}

function ToolboxTableHeader(
  props: React.ComponentProps<typeof BaseTableHeader>,
) {
  return <BaseTableHeader {...props} />;
}

function ToolboxTableHeaderRow({
  className,
  ...props
}: React.ComponentProps<typeof BaseTableRow>) {
  return (
    <BaseTableRow
      className={cn("hover:bg-transparent", className)}
      {...props}
    />
  );
}

function ToolboxTableBody(
  props: React.ComponentProps<typeof BaseTableBody>,
) {
  return <BaseTableBody {...props} />;
}

function ToolboxTableRow(
  props: React.ComponentProps<typeof BaseTableRow>,
) {
  return <BaseTableRow {...props} />;
}

function ToolboxTableHead({
  className,
  first,
  ...props
}: React.ComponentProps<typeof BaseTableHead> & { first?: boolean }) {
  return (
    <BaseTableHead
      className={cn(first && "pl-4", className)}
      {...props}
    />
  );
}

function ToolboxTableCell({
  className,
  first,
  ...props
}: React.ComponentProps<typeof BaseTableCell> & { first?: boolean }) {
  return (
    <BaseTableCell
      className={cn(first && "pl-4 font-medium", className)}
      {...props}
    />
  );
}

export {
  ToolboxTable,
  ToolboxTableHeader,
  ToolboxTableHeaderRow,
  ToolboxTableBody,
  ToolboxTableRow,
  ToolboxTableHead,
  ToolboxTableCell,
};
