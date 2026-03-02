import { usePathname } from "next/navigation";

export function useCurrentPageSettings() {
  const pathname = usePathname() ?? "";

  const isActivityDetail = pathname.startsWith("/activities/");

  return {
    hasExplorerTilesToggle: pathname === "/heatmap",
    hasRiderSettings: pathname.startsWith("/training"),
    hasSyncPanel: pathname === "/activities",
    hideSettings: isActivityDetail || pathname.startsWith("/settings"),
  };
}
