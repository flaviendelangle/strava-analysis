# Plan: Code Readability Improvements

## Context

Next.js + TypeScript codebase. Uses Drizzle ORM on server, tRPC for API, React on frontend. Has some duplicated logic between client and server code, inconsistent import styles, magic numbers, and cryptic variable names in algorithmic code.

---

## Fix 1: Deduplicate HRSS calculation (client + server)

**Files:**
- `src/utils/hrss.ts` (lines 17-18, 87-119) — client-side `calculateHRSS`
- `server/lib/computeScores.ts` (lines 7-8, 20-48) — server-side `calculateHRSS`

**Problem:** Identical algorithm duplicated. The client version has extensive JSDoc, the server version is compact. Both use the same constants and logic.

**Fix:** Keep the implementation in `server/lib/computeScores.ts` (since it's the canonical computation location) and re-export from the client file.

1. In `server/lib/computeScores.ts`, the `calculateHRSS` function accepts `HrssSettings` (an interface with `restingHr`, `maxHr`, `lthr`). This is compatible with the client-side `RiderSettings` type (which is a superset).

2. Update `src/utils/hrss.ts` to re-export:
```typescript
export { calculateHRSS } from "../../server/lib/computeScores";
```

3. Keep the JSDoc documentation as a comment in `src/utils/hrss.ts` above the re-export if you want to preserve it, or move the JSDoc to the server file.

4. Verify that no client-only APIs are used in `server/lib/computeScores.ts` (it's pure math — confirmed, no Node or browser-specific APIs).

5. Check the `HrssSettings` interface in `server/lib/computeScores.ts` — make sure `RiderSettings` from `~/sensors/types` is compatible (it has `restingHr`, `maxHr`, `lthr` plus extra fields — TypeScript structural typing means it's assignable).

---

## Fix 2: Deduplicate resolveRiderSettings (client + server)

**Files:**
- `src/utils/resolveRiderSettings.ts` (lines 14-35) — client-side
- `server/lib/computeScores.ts` (lines 150-166) — server-side

**Problem:** Same algorithm duplicated. The client version handles additional fields (`cdA`, `crr`, `bikeWeightKg`), the server version only handles HR/power fields. The comment in the client file explicitly says "NOTE: The core logic is duplicated [...]. Keep both in sync."

**Fix:** Since the client version is a superset (handles more fields), make the server import and use the client version. Or better, extract the core logic to a shared location.

1. Create `src/utils/resolveRiderSettings.ts` as the single source of truth (it already is the more complete version).

2. In `server/lib/computeScores.ts`, replace the local `resolveRiderSettings` with an import:
```typescript
import { resolveRiderSettings } from "../../src/utils/resolveRiderSettings";
```

3. The server's `SettingsTimeline` type (lines 129-145) won't have `cdA`, `crr`, `bikeWeightKg` — but `resolveRiderSettings` in the client uses `RiderSettingsTimeline` which expects those. You'll need to make the function generic enough. The simplest approach: make the client-side function accept a simpler interface that both can satisfy:

Actually, looking at the code more carefully: the server's `resolveRiderSettings` returns `ResolvedSettings` (ftp, weightKg, restingHr, maxHr, lthr) while the client's returns `RiderSettings` (those + cdA, crr, bikeWeightKg). They have slightly different signatures.

Simpler approach: just leave the server function as-is but add a comment pointing to the client version. OR extract the common loop logic into a generic function in a shared file like `src/utils/resolveTimeline.ts`:

```typescript
export function resolveTimeline<T extends Record<string, unknown>>(
  initialValues: T,
  changes: Array<{ date: string } & Partial<T>>,
  targetDate: string,
): T {
  const result = { ...initialValues };
  for (const change of changes) {
    if (change.date > targetDate) break;
    for (const key of Object.keys(initialValues)) {
      if (change[key] !== undefined) {
        (result as any)[key] = change[key];
      }
    }
  }
  return result;
}
```

Then both client and server versions become thin wrappers calling this shared function.

---

## Fix 3: Deduplicate FIELD_CONFIG between settings components

**Files:**
- `src/components/settings/ChangePointDialog.tsx` (lines 21-34) — `FIELD_CONFIG` with field, label, unit, min, step
- `src/components/settings/ChangePointsTimeline.tsx` (lines 23-33) — `FIELD_COLUMNS` with field, label, unit

**Problem:** Nearly identical arrays.

**Fix:** Create a shared constant in `src/components/settings/fieldConfig.ts`:
```typescript
import type { TimeVaryingField } from "~/sensors/types";

export const RIDER_FIELD_CONFIG: {
  field: TimeVaryingField;
  label: string;
  unit: string;
  min: number;
  step: number;
  smallStep?: number;
}[] = [
  { field: "ftp", label: "FTP", unit: "W", min: 0, step: 1 },
  { field: "weightKg", label: "Weight", unit: "kg", min: 0, step: 1 },
  { field: "restingHr", label: "Resting HR", unit: "bpm", min: 30, step: 1 },
  { field: "maxHr", label: "Max HR", unit: "bpm", min: 100, step: 1 },
  { field: "lthr", label: "LTHR", unit: "bpm", min: 60, step: 1 },
];
```

Then import from both `ChangePointDialog.tsx` and `ChangePointsTimeline.tsx`. Remove their local definitions.

---

## Fix 4: Extract POWER_BEST_ACTIVITY_TYPES to shared constant

**Files:**
- `server/lib/sync.ts`, line 16: `const POWER_BEST_ACTIVITY_TYPES = ["Ride", "VirtualRide"];`
- `src/pages/statistics/index.tsx`, line 14: `activityTypes={["Ride", "VirtualRide"]}`

**Problem:** Hardcoded in two places.

**Fix:** Create `src/utils/constants.ts`:
```typescript
/** Activity types for which power bests / power curve are computed. */
export const POWER_BEST_ACTIVITY_TYPES = ["Ride", "VirtualRide"] as const;
```

Import in both `server/lib/sync.ts` and `src/pages/statistics/index.tsx`.

---

## Fix 5: Standardize import paths to use `~` alias

**Files with relative imports that should use `~`:**
- `src/components/Map/ExplorerTilesLayer.tsx`, line 5: `import type { Activity } from "../../../server/db/types";`
- `src/components/Map/ExplorerTilesStats.tsx`, line 3: `import type { Activity } from "../../../server/db/types";`
- `src/components/ActivitiesTable.tsx`: look for `import type { Activity } from "../../server/db/types";`
- `src/components/ActivityStats.tsx`, line 1: `import type { Activity } from "../../server/db/types";`
- `src/hooks/useExplorerTiles.ts`, line 3: `import type { Activity } from "../../server/db/types";`
- `src/hooks/useTimeSlices.ts`: look for similar pattern

**Fix:** Replace all `../../server/db/types` and `../../../server/db/types` imports with the `~` alias. Check if `~` maps to `src/` (check `tsconfig.json` paths). If so, these would become:
```typescript
import type { Activity } from "~/../../server/db/types";
```

Wait — if `~` maps to `src/`, then `server/` is outside `src/`. Check the actual tsconfig paths configuration. The server types might need a different alias. If no alias covers `server/`, consider either:
- Adding a `@server` path alias in tsconfig
- Or keeping the relative imports but making them consistent (always from the file's perspective)

The simplest fix: add a path alias in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./src/*"],
      "@server/*": ["./server/*"]
    }
  }
}
```

Then all imports become `import type { Activity } from "@server/db/types";`.

---

## Fix 6: Name magic numbers in ExportPanel

**File:** `src/components/liveTraining/ExportPanel.tsx`

**Problem:** Lines 58-59 have unnamed magic numbers:
```typescript
while (attempts < 30) {
  await new Promise((r) => setTimeout(r, 2000));
```

**Fix:** Add named constants at the top of the file:
```typescript
/** Maximum number of polling attempts when waiting for Strava to process the upload. */
const MAX_UPLOAD_POLL_ATTEMPTS = 30;
/** Interval between upload status checks (ms). */
const UPLOAD_POLL_INTERVAL_MS = 2_000;
```

Replace the magic numbers with these constants.

---

## Fix 7: Name magic numbers in ActivitiesTable

**File:** `src/components/ActivitiesTable.tsx`

**Problem:** Lines 141 and 194 have unnamed magic numbers:
```typescript
overscan: 20
Array.from({ length: 25 })
```

**Fix:** Add named constants:
```typescript
const VIRTUALIZER_OVERSCAN = 20;
const SKELETON_ROW_COUNT = 25;
```

---

## Fix 8: Rename cryptic variables in explorerTiles algorithm

**File:** `src/utils/explorerTiles.ts`, lines 79-146 (`walkTiles` function)

**Problem:** Variables like `fx1`, `fy1`, `tMaxX`, `tMaxY`, `cx`, `cy` are cryptic.

**Fix:** Rename for clarity:
- `fx1` → `fracTileStartX` (fractional tile X coordinate of start point)
- `fy1` → `fracTileStartY`
- `fx2` → `fracTileEndX`
- `fy2` → `fracTileEndY`
- `cx` → `currentTileX`
- `cy` → `currentTileY`
- `tMaxX` → `nextCrossingX` (parameter at which the ray crosses the next vertical tile boundary)
- `tMaxY` → `nextCrossingY`
- `tDeltaX` → `crossingStepX` (parameter increment per tile in X direction)
- `tDeltaY` → `crossingStepY`

Also add a brief comment at the top of `walkTiles` explaining it uses a DDA (Digital Differential Analyzer) / Bresenham-like line rasterization algorithm to walk tiles between two GPS coordinates.

---

## Fix 9: Add ESLint disable justifications

**File:** `src/pages/training/index.tsx`, lines 135, 142, 153

**Problem:** `eslint-disable-line react-hooks/exhaustive-deps` without explanation.

**Fix:** Add justification comments:
```typescript
// Line 135:
}, [trainer.supportsControl]); // eslint-disable-line react-hooks/exhaustive-deps -- ergMode methods are stable refs, including them would cause infinite loops

// Line 142:
}, [trainer.state]); // eslint-disable-line react-hooks/exhaustive-deps -- ergMode.setErgEnabled is a stable context setter

// Line 153:
}, [ergMode.ergEnabled, ergMode.targetPower, trainer.supportsControl]); // eslint-disable-line react-hooks/exhaustive-deps -- trainer.setTargetPower is a stable ref
```

---

## Summary of changes by file

| File | Fix |
|------|-----|
| `src/utils/hrss.ts` | Fix 1: re-export from server |
| `server/lib/computeScores.ts` | Fix 1, 2: becomes single source of truth |
| `src/utils/resolveRiderSettings.ts` | Fix 2: extract shared logic |
| `src/components/settings/fieldConfig.ts` | Fix 3: new shared constant file |
| `src/components/settings/ChangePointDialog.tsx` | Fix 3: import shared config |
| `src/components/settings/ChangePointsTimeline.tsx` | Fix 3: import shared config |
| `src/utils/constants.ts` | Fix 4: new shared constants |
| `server/lib/sync.ts` | Fix 4: import shared constant |
| `src/pages/statistics/index.tsx` | Fix 4: import shared constant |
| `tsconfig.json` | Fix 5: add `@server` path alias |
| Multiple component files | Fix 5: update imports |
| `src/components/liveTraining/ExportPanel.tsx` | Fix 6: name magic numbers |
| `src/components/ActivitiesTable.tsx` | Fix 7: name magic numbers |
| `src/utils/explorerTiles.ts` | Fix 8: rename variables |
| `src/pages/training/index.tsx` | Fix 9: add eslint justifications |
