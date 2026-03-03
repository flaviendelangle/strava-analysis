import { usePathname } from "next/navigation";

export function useCurrentPageSettings() {
  const pathname = usePathname() ?? "";

  const isActivityDetail = pathname.startsWith("/activities/");

  const isTraining = pathname.startsWith("/training");

  return {
    hasActivityTypeFilter: !isTraining,
    hasExplorerTilesToggle: pathname === "/heatmap",
    hasSyncPanel: pathname === "/activities",
    hideSettings: isActivityDetail || pathname.startsWith("/settings"),
  };
}
