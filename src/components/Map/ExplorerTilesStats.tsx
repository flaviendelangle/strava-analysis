import type { ExplorerTilesResult } from "~/utils/explorerTiles";

interface ExplorerTilesStatsProps {
  tilesData: ExplorerTilesResult | null;
  visible: boolean;
}

export function ExplorerTilesStats({
  tilesData,
  visible,
}: ExplorerTilesStatsProps) {
  if (!visible || !tilesData) return null;

  const { stats } = tilesData;

  return (
    <div className="bg-background/90 text-foreground absolute bottom-4 left-4 z-1000 rounded-md px-4 py-3 text-sm shadow-lg">
      <div className="mb-1 font-semibold">Explorer Tiles</div>
      <div>Visited: {stats.totalVisited.toLocaleString()}</div>
      <div>
        Max square: {stats.maxSquareSide} x {stats.maxSquareSide}
      </div>
      <div>Largest cluster: {stats.largestClusterSize.toLocaleString()}</div>
      <div>Clusters: {stats.clusterCount}</div>
    </div>
  );
}
