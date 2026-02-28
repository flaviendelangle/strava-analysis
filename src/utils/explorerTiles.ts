import type { LatLngTuple } from "./polyline";

// --- Web Mercator (EPSG:3857) projection helpers ---

const R = 6_378_137; // WGS84 semi-major axis in meters

function lngToMx(lng: number): number {
  return R * lng * (Math.PI / 180);
}

function latToMy(lat: number): number {
  const latRad = lat * (Math.PI / 180);
  return R * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

function mxToLng(mx: number): number {
  return (mx / R) * (180 / Math.PI);
}

function myToLat(my: number): number {
  return (2 * Math.atan(Math.exp(my / R)) - Math.PI / 2) * (180 / Math.PI);
}

// --- Tile coordinate system ---
// Tiles are a uniform grid in Mercator space → always perfectly square on the map.
// `step` is in Mercator meters. At refLat the real-world side ≈ 1 km.

export interface TileCoordSystem {
  step: number; // Mercator meters per tile side
}

export function createTileCoordSystem(refLat: number): TileCoordSystem {
  const cosLat = Math.max(Math.cos((refLat * Math.PI) / 180), 0.01);
  const step = 1000 / cosLat; // ~1 km real-world at refLat
  return { step };
}

export function pointToTile(
  lat: number,
  lng: number,
  system: TileCoordSystem,
): { tx: number; ty: number } {
  return {
    tx: Math.floor(lngToMx(lng) / system.step),
    ty: Math.floor(latToMy(lat) / system.step),
  };
}

export function tileToBounds(
  tx: number,
  ty: number,
  system: TileCoordSystem,
): { south: number; west: number; north: number; east: number } {
  return {
    south: myToLat(ty * system.step),
    north: myToLat((ty + 1) * system.step),
    west: mxToLng(tx * system.step),
    east: mxToLng((tx + 1) * system.step),
  };
}

// --- Tile key helpers ---

type TileKey = string;

function tileKey(tx: number, ty: number): TileKey {
  return `${tx},${ty}`;
}

function parseTileKey(key: TileKey): { tx: number; ty: number } {
  const sep = key.indexOf(",");
  return {
    tx: Number(key.slice(0, sep)),
    ty: Number(key.slice(sep + 1)),
  };
}

// --- Tile discovery ---

const MAX_SEGMENT_DISTANCE_DEG = 0.05; // ~5.5 km — skip GPS dropouts

/**
 * Walk a line segment in Mercator space and collect every grid cell
 * the segment passes through (Amanatides & Woo grid traversal).
 */
function walkTiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  system: TileCoordSystem,
  visited: Set<TileKey>,
): void {
  const mx1 = lngToMx(lng1);
  const my1 = latToMy(lat1);
  const mx2 = lngToMx(lng2);
  const my2 = latToMy(lat2);

  const startTx = Math.floor(mx1 / system.step);
  const startTy = Math.floor(my1 / system.step);
  const endTx = Math.floor(mx2 / system.step);
  const endTy = Math.floor(my2 / system.step);

  visited.add(tileKey(startTx, startTy));

  if (startTx === endTx && startTy === endTy) return;

  const dmx = mx2 - mx1;
  const dmy = my2 - my1;

  const stepX = dmx > 0 ? 1 : dmx < 0 ? -1 : 0;
  const stepY = dmy > 0 ? 1 : dmy < 0 ? -1 : 0;

  let tMaxX: number;
  let tDeltaX: number;
  if (stepX !== 0) {
    const nextBoundary =
      stepX > 0
        ? (startTx + 1) * system.step
        : startTx * system.step;
    tMaxX = (nextBoundary - mx1) / dmx;
    tDeltaX = Math.abs(system.step / dmx);
  } else {
    tMaxX = Infinity;
    tDeltaX = Infinity;
  }

  let tMaxY: number;
  let tDeltaY: number;
  if (stepY !== 0) {
    const nextBoundary =
      stepY > 0
        ? (startTy + 1) * system.step
        : startTy * system.step;
    tMaxY = (nextBoundary - my1) / dmy;
    tDeltaY = Math.abs(system.step / dmy);
  } else {
    tMaxY = Infinity;
    tDeltaY = Infinity;
  }

  let cx = startTx;
  let cy = startTy;
  const maxSteps =
    Math.abs(endTx - startTx) + Math.abs(endTy - startTy) + 2;

  for (let i = 0; i < maxSteps; i++) {
    if (tMaxX < tMaxY) {
      cx += stepX;
      tMaxX += tDeltaX;
    } else {
      cy += stepY;
      tMaxY += tDeltaY;
    }
    visited.add(tileKey(cx, cy));
    if (cx === endTx && cy === endTy) break;
  }
}

export function discoverTiles(
  polylines: LatLngTuple[][],
  system: TileCoordSystem,
): Set<TileKey> {
  const visited = new Set<TileKey>();

  for (const polyline of polylines) {
    if (polyline.length === 0) continue;

    const [lat0, lng0] = polyline[0];
    const t0 = pointToTile(lat0, lng0, system);
    visited.add(tileKey(t0.tx, t0.ty));

    for (let i = 1; i < polyline.length; i++) {
      const [prevLat, prevLng] = polyline[i - 1];
      const [curLat, curLng] = polyline[i];

      // Skip GPS dropouts
      if (
        Math.abs(curLat - prevLat) > MAX_SEGMENT_DISTANCE_DEG ||
        Math.abs(curLng - prevLng) > MAX_SEGMENT_DISTANCE_DEG
      ) {
        const t = pointToTile(curLat, curLng, system);
        visited.add(tileKey(t.tx, t.ty));
        continue;
      }

      walkTiles(prevLat, prevLng, curLat, curLng, system, visited);
    }
  }

  return visited;
}

// --- Connected components (BFS, 4-connectivity) ---

const NEIGHBORS_4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

interface ConnectedComponent {
  tiles: Set<TileKey>;
  size: number;
}

export function findConnectedComponents(
  visited: Set<TileKey>,
): ConnectedComponent[] {
  const seen = new Set<TileKey>();
  const components: ConnectedComponent[] = [];

  for (const key of visited) {
    if (seen.has(key)) continue;

    const component = new Set<TileKey>();
    const stack: TileKey[] = [key];
    seen.add(key);

    while (stack.length > 0) {
      const current = stack.pop()!;
      component.add(current);
      const { tx, ty } = parseTileKey(current);

      for (const [dx, dy] of NEIGHBORS_4) {
        const nk = tileKey(tx + dx, ty + dy);
        if (visited.has(nk) && !seen.has(nk)) {
          seen.add(nk);
          stack.push(nk);
        }
      }
    }

    components.push({ tiles: component, size: component.size });
  }

  components.sort((a, b) => b.size - a.size);
  return components;
}

// --- Largest axis-aligned square (DP) ---

export interface MaxSquareResult {
  side: number;
  tiles: Set<TileKey>;
}

export function findMaxSquare(clusterTiles: Set<TileKey>): MaxSquareResult {
  if (clusterTiles.size === 0) {
    return { side: 0, tiles: new Set() };
  }

  let minTx = Infinity;
  let maxTx = -Infinity;
  let minTy = Infinity;
  let maxTy = -Infinity;

  for (const key of clusterTiles) {
    const { tx, ty } = parseTileKey(key);
    if (tx < minTx) minTx = tx;
    if (tx > maxTx) maxTx = tx;
    if (ty < minTy) minTy = ty;
    if (ty > maxTy) maxTy = ty;
  }

  const width = maxTx - minTx + 1;
  const height = maxTy - minTy + 1;

  // Flat DP array for cache friendliness
  const dp = new Int32Array(width * height);

  let bestSide = 0;
  let bestRow = 0;
  let bestCol = 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const ty = minTy + row;
      const tx = minTx + col;

      if (!clusterTiles.has(tileKey(tx, ty))) {
        continue; // dp stays 0
      }

      const idx = row * width + col;

      if (row === 0 || col === 0) {
        dp[idx] = 1;
      } else {
        dp[idx] =
          Math.min(
            dp[(row - 1) * width + col],
            dp[row * width + (col - 1)],
            dp[(row - 1) * width + (col - 1)],
          ) + 1;
      }

      if (dp[idx] > bestSide) {
        bestSide = dp[idx];
        bestRow = row;
        bestCol = col;
      }
    }
  }

  const squareTiles = new Set<TileKey>();
  const originTx = minTx + bestCol - bestSide + 1;
  const originTy = minTy + bestRow - bestSide + 1;
  for (let dy = 0; dy < bestSide; dy++) {
    for (let dx = 0; dx < bestSide; dx++) {
      squareTiles.add(tileKey(originTx + dx, originTy + dy));
    }
  }

  return { side: bestSide, tiles: squareTiles };
}

// --- Tile classification ---

export type TileCategory =
  | "maxSquare"
  | "cluster"
  | "clusterBorder"
  | "isolated";

export interface ClassifiedTile {
  tx: number;
  ty: number;
  category: TileCategory;
}

export interface ExplorerTilesResult {
  tiles: ClassifiedTile[];
  system: TileCoordSystem;
  stats: {
    totalVisited: number;
    maxSquareSide: number;
    largestClusterSize: number;
    clusterCount: number;
  };
}

export function classifyTiles(
  visited: Set<TileKey>,
  components: ConnectedComponent[],
  maxSquare: MaxSquareResult,
): ClassifiedTile[] {
  const largestCluster = components[0]?.tiles ?? new Set<TileKey>();
  const result: ClassifiedTile[] = [];

  for (const key of visited) {
    const { tx, ty } = parseTileKey(key);

    let category: TileCategory;

    if (maxSquare.tiles.has(key)) {
      category = "maxSquare";
    } else if (!largestCluster.has(key)) {
      category = "isolated";
    } else {
      const allNeighborsVisited = NEIGHBORS_4.every(([dx, dy]) =>
        visited.has(tileKey(tx + dx, ty + dy)),
      );
      category = allNeighborsVisited ? "cluster" : "clusterBorder";
    }

    result.push({ tx, ty, category });
  }

  return result;
}

/**
 * Full pipeline: polylines → classified tiles with stats.
 */
export function computeExplorerTiles(
  polylines: LatLngTuple[][],
  system: TileCoordSystem,
): ExplorerTilesResult {
  const visited = discoverTiles(polylines, system);

  if (visited.size === 0) {
    return {
      tiles: [],
      system,
      stats: {
        totalVisited: 0,
        maxSquareSide: 0,
        largestClusterSize: 0,
        clusterCount: 0,
      },
    };
  }

  const components = findConnectedComponents(visited);
  const maxSquare = findMaxSquare(components[0]?.tiles ?? new Set());
  const classified = classifyTiles(visited, components, maxSquare);

  return {
    tiles: classified,
    system,
    stats: {
      totalVisited: visited.size,
      maxSquareSide: maxSquare.side,
      largestClusterSize: components[0]?.size ?? 0,
      clusterCount: components.length,
    },
  };
}
