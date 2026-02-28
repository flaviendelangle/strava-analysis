import type { Doc } from "../../../convex/_generated/dataModel";
import { useExplorerTiles } from "~/hooks/useExplorerTiles";

interface ExplorerTilesStatsProps {
  activities: Doc<"activities">[] | null;
  visible: boolean;
}

export function ExplorerTilesStats({
  activities,
  visible,
}: ExplorerTilesStatsProps) {
  const tilesData = useExplorerTiles(activities);

  if (!visible || !tilesData) return null;

  const { stats } = tilesData;

  return (
    <div className="absolute bottom-4 left-4 z-[1000] rounded-md bg-gray-800/90 px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-1 font-semibold">Explorer Tiles</div>
      <div>
        Visited: {stats.totalVisited.toLocaleString()}
      </div>
      <div>
        Max square: {stats.maxSquareSide} x {stats.maxSquareSide}
      </div>
      <div>
        Largest cluster: {stats.largestClusterSize.toLocaleString()}
      </div>
      <div>
        Clusters: {stats.clusterCount}
      </div>
    </div>
  );
}
