# Plan: React Performance Improvements

## Context

This is a Next.js app using React 19, tRPC for data fetching, MUI X Charts Pro for charting, Leaflet for maps. The training page records live sensor data at 1 Hz and displays it in real-time charts.

---

## Fix 1: Eliminate array recreation every second on training page

**File:** `src/pages/training/index.tsx`, lines 118 and 234

**Problem:** Every second during recording, the entire data points array is cloned:
```typescript
setChartData([...getDataPoints()]);
```
With a 1-hour session that's 3,600 new arrays of growing size. The array at minute 60 has 3,600 elements, all copied.

**Fix:** Instead of copying the full array, store just the length counter and derive the chart data via `useMemo`:

```typescript
// Replace line 47:
// const [chartData, setChartData] = useState<SessionDataPoint[]>([]);
const [dataVersion, setDataVersion] = useState(0);

// In the recording interval (line 118), replace:
// setChartData([...getDataPoints()]);
setDataVersion((v) => v + 1);

// Add a derived value:
const chartData = React.useMemo(
  () => getDataPoints(),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [dataVersion],
);
```

Do the same for line 234 (stop handler) and line 172 (auto-start clear). For the stop handler:
```typescript
onStop={() => {
  session.stop();
  recorder.computeSummary();
  setDataVersion((v) => v + 1);
}}
```

For the auto-start clear (line 172):
```typescript
recorder.clear();
setDataVersion(0);
```

**Important:** This requires that `useTrainingRecorder`'s `getDataPoints()` returns its internal array by reference (not a copy). Check `src/hooks/useTrainingRecorder.ts` — if it already returns the internal array, this works. If it copies, update it to return the reference and let React's `useMemo` handle the identity.

---

## Fix 2: Wrap PowerHrChart in React.memo

**File:** `src/components/liveTraining/PowerHrChart.tsx`, line 25

**Problem:** `PowerHrChart` re-renders on every parent render (every 1 second during recording), even though its internal `useMemo` hooks already depend on `points`. Without `React.memo`, the component function body runs on every parent render.

**Fix:** Wrap the export:
```typescript
export const PowerHrChart = React.memo(function PowerHrChart(props: PowerHrChartProps) {
  // ... existing code unchanged
});
```

Since `dataPoints` will be a stable reference after Fix 1 (same array object until `dataVersion` changes), `React.memo` will correctly skip re-renders when nothing changed.

---

## Fix 3: Deduplicate useExplorerTiles computation

**Files:**
- `src/components/Map/ExplorerTilesLayer.tsx`, line 27
- `src/components/Map/ExplorerTilesStats.tsx`, line 14
- `src/hooks/useExplorerTiles.ts`

**Problem:** Both `ExplorerTilesLayer` and `ExplorerTilesStats` independently call `useExplorerTiles(activities)`, which decodes all polylines and computes explorer tiles twice.

**Fix:** Lift the computation to their shared parent. Find the parent component that renders both (likely the heatmap page or a map wrapper). Call `useExplorerTiles` once there and pass the result as a prop:

1. In the parent component (check `src/pages/heatmap/index.tsx` or the component that renders both):
```typescript
const tilesData = useExplorerTiles(activities);
```

2. Update `ExplorerTilesLayer` to accept `tilesData` as a prop instead of `activities`:
```typescript
interface ExplorerTilesLayerProps {
  tilesData: ExplorerTilesResult | null;
  visible: boolean;
}

export function ExplorerTilesLayer({ tilesData, visible }: ExplorerTilesLayerProps) {
  // Remove: const tilesData = useExplorerTiles(activities);
  // ... rest stays the same
}
```

3. Update `ExplorerTilesStats` similarly:
```typescript
interface ExplorerTilesStatsProps {
  tilesData: ExplorerTilesResult | null;
  visible: boolean;
}

export function ExplorerTilesStats({ tilesData, visible }: ExplorerTilesStatsProps) {
  // Remove: const tilesData = useExplorerTiles(activities);
  // ... rest stays the same
}
```

---

## Fix 4: Single TooltipProvider instead of one per StatCard

**File:** `src/components/primitives/StatCard.tsx`, lines 32-38

**Problem:** Every `StatCard` with a tooltip wraps itself in a `<TooltipProvider>`. The `ActivityStats` component renders up to 18 `StatCard`s, creating up to 18 provider instances.

**Fix:** Remove `TooltipProvider` from `StatCard` and add it once at a higher level.

1. Update `StatCard.tsx`:
```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

// Remove TooltipProvider from import

export function StatCard({ label, value, tooltip }: { ... }) {
  const card = (
    <div className="rounded-md bg-gray-800 px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-gray-400">{label}</div>
      <div className="font-mono text-lg font-bold text-white">{value ?? "--"}</div>
    </div>
  );

  if (!tooltip) return card;

  return (
    <Tooltip>
      <TooltipTrigger render={card} />
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
```

2. Add a single `TooltipProvider` in `ActivityStats.tsx` (wrapping the grid):
```typescript
import { TooltipProvider } from "~/components/ui/tooltip";

export function ActivityStats({ activity }: ActivityStatsProps) {
  // ...
  return (
    <div className="rounded-lg bg-card p-4">
      <h3 className="mb-3 text-lg font-medium">Activity Details</h3>
      <TooltipProvider>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {/* ... StatCards ... */}
        </div>
      </TooltipProvider>
    </div>
  );
}
```

3. Check if `StatCard` is used with tooltips in other places and add `TooltipProvider` there too if needed (search for `<StatCard` with `tooltip=` across the codebase).

---

## Fix 5: Skip tile rendering when explorer tiles are hidden

**File:** `src/components/Map/ExplorerTilesLayer.tsx`, lines 49-80

**Problem:** The rectangle-building effect runs whenever `tilesData` changes, even if `visible` is false.

**Fix:** Add an early return when not visible:
```typescript
React.useEffect(() => {
  const layer = layerRef.current;
  const renderer = rendererRef.current;
  if (!layer || !renderer || !tilesData || !visible) {
    layer?.clearLayers();
    return;
  }
  // ... rest unchanged
}, [tilesData, visible]); // Add visible to deps
```

Note: also add `visible` to the dependency array of this effect.

---

## Summary of changes by file

| File | Fix |
|------|-----|
| `src/pages/training/index.tsx` | Fix 1 |
| `src/components/liveTraining/PowerHrChart.tsx` | Fix 2 |
| `src/components/Map/ExplorerTilesLayer.tsx` | Fix 3, 5 |
| `src/components/Map/ExplorerTilesStats.tsx` | Fix 3 |
| `src/hooks/useExplorerTiles.ts` | Fix 3 (may keep, just used from parent now) |
| `src/components/primitives/StatCard.tsx` | Fix 4 |
| `src/components/ActivityStats.tsx` | Fix 4 |
| Parent of ExplorerTilesLayer/Stats (heatmap page) | Fix 3 |
