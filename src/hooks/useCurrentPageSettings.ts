import { usePathname } from "next/navigation";

export function useCurrentPageSettings() {
  const pathname = usePathname() ?? "";

  const isActivityDetail =
    pathname.startsWith("/activities/") &&
    pathname !== "/activities/table" &&
    pathname !== "/activities/map";

  return {
    hasExplorerTilesToggle: pathname === "/activities/map",
    hasRiderSettings: pathname.startsWith("/training"),
    hideSettings: isActivityDetail,
  };
}
