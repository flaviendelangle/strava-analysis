# Plan: SQL & Database Performance Improvements

## Context

This is a Next.js + tRPC + Drizzle ORM app that syncs cycling/running data from Strava into PostgreSQL, computes training scores, and displays analytics. The sync process has 3 phases: (1) fetch activity list from Strava API, (2) fetch streams per activity from Strava API, (3) compute scores locally from DB data.

**IMPORTANT: Strava API constraints**
- Phase 1 (activity list) already has a 5-second delay between pages — do NOT change this
- Phase 2 (streams) makes 1 HTTP call per activity to Strava — this is inherent to the API (one stream endpoint per activity), do NOT try to batch Strava API calls
- Phase 3 (scores) makes ZERO Strava API calls — purely local DB computation, safe to optimize aggressively
- `storeStreams()` and `computeActivityScoresInternal()` are DB-only — safe to optimize
- The `activities.list`, `activities.get`, `activities.getStreams`, `activities.getPowerCurve` tRPC queries are all DB-only — safe to optimize

All fixes below are DB-only optimizations that do NOT affect Strava API call patterns.

---

## Fix 1: Replace per-activity duplicate check with INSERT ON CONFLICT

**File:** `server/lib/sync.ts`, lines 93-105 (inside `syncActivitiesPhase`)

**Current code (N+1 pattern):**
```typescript
for (const raw of pageActivities) {
  const model = getModelFromStravaActivity(raw);
  const existing = await db.query.activities.findFirst({
    where: eq(activities.stravaId, model.stravaId),
  });
  if (!existing) {
    await db.insert(activities).values({
      ...model,
      areStreamsLoaded: false,
    });
    insertedCount++;
  }
}
```

**Fix:** Replace the entire for-loop with a single batch insert using `ON CONFLICT DO NOTHING`:
```typescript
const models = pageActivities.map((raw) => ({
  ...getModelFromStravaActivity(raw),
  areStreamsLoaded: false,
}));

if (models.length > 0) {
  const result = await db
    .insert(activities)
    .values(models)
    .onConflictDoNothing({ target: activities.stravaId })
    .returning({ id: activities.id });
  insertedCount = result.length;
}
```

This replaces up to 100 queries (50 SELECTs + 50 INSERTs) with 1 query.

---

## Fix 2: Fix wrong sort direction for latest activity lookup

**File:** `server/lib/sync.ts`, lines 53-63

**Current code:** Sorts ASC then reduces in JS to find the max:
```typescript
const [latestActivity] = await db
  .select()
  .from(activities)
  .where(eq(activities.athlete, athleteId))
  .orderBy(asc(activities.startDate))
  .limit(1)
  .then((rows) =>
    rows.length > 0
      ? [rows.reduce((a, b) => (a.startDate > b.startDate ? a : b))]
      : [null],
  );
```

**Fix:** Use `desc` and remove the JS reduce. Also select only the needed column:
```typescript
import { desc } from "drizzle-orm";

const latestActivity = await db
  .select({ startDate: activities.startDate })
  .from(activities)
  .where(eq(activities.athlete, athleteId))
  .orderBy(desc(activities.startDate))
  .limit(1)
  .then((rows) => rows[0] ?? null);
```

---

## Fix 3: Use COUNT instead of SELECT * for activities-without-streams count

**File:** `server/lib/sync.ts`, lines 126-134

**Current code:** Fetches all columns of all activities without streams just to get `.length`:
```typescript
const activitiesWithoutStreams = await db
  .select()
  .from(activities)
  .where(
    and(
      eq(activities.athlete, athleteId),
      eq(activities.areStreamsLoaded, false),
    ),
  );
```

**Fix:** Use a count query:
```typescript
import { count } from "drizzle-orm";

const [{ total }] = await db
  .select({ total: count() })
  .from(activities)
  .where(
    and(
      eq(activities.athlete, athleteId),
      eq(activities.areStreamsLoaded, false),
    ),
  );
```

Then update line 141: `streamsTotal: total,` and line 140: `status: total > 0 ? "fetching_streams" : "computing_scores",`

---

## Fix 4: Batch stream inserts in storeStreams

**File:** `server/lib/sync.ts`, lines 278-287

**Current code:** Inserts streams one by one:
```typescript
for (const stream of streams) {
  await db.insert(activityStreams).values({
    activityId,
    type: stream.type,
    seriesType: stream.seriesType,
    originalSize: stream.originalSize,
    resolution: stream.resolution,
    data: JSON.stringify(stream.data),
  });
}
```

**Fix:** Single batch insert:
```typescript
if (streams.length > 0) {
  await db.insert(activityStreams).values(
    streams.map((stream) => ({
      activityId,
      type: stream.type,
      seriesType: stream.seriesType,
      originalSize: stream.originalSize,
      resolution: stream.resolution,
      data: JSON.stringify(stream.data),
    })),
  );
}
```

---

## Fix 5: Avoid re-querying activity in storeStreams

**File:** `server/lib/sync.ts`, lines 294-306

**Current code:** After storing streams, re-queries `riderSettings` and `activity` to compute scores:
```typescript
const settingsDoc = await db.query.riderSettings.findFirst({
  where: eq(riderSettings.athlete, athleteId),
});

if (settingsDoc) {
  const activity = await db.query.activities.findFirst({
    where: eq(activities.id, activityId),
  });
  if (activity) {
    await computeActivityScoresInternal(db, activity, settingsDoc);
  }
}
```

**Fix:** Accept the activity object as a parameter instead of re-querying. Update the `storeStreams` signature to accept an optional `activity` parameter, and update all callers:

In `syncStreamsPhase` (line 191), the caller already has the activity's `id` and `stravaId` but not all fields needed by `computeActivityScoresInternal`. The simplest fix is to query the activity once *before* calling `storeStreams` and pass it through. Change the signature:

```typescript
export async function storeStreams(
  db: Database,
  activityId: number,
  athleteId: number,
  streams: ReturnType<typeof normalizeStreams>,
  /** Pre-fetched settings to avoid re-querying; will be fetched if not provided */
  settingsDoc?: { initialValues: ...; changes: ... } | null,
) {
```

Then at lines 294-306, use the passed-in `settingsDoc` if available, otherwise fetch it. And fetch the activity only once.

Alternatively — and simpler — just move the score computation out of `storeStreams` entirely. The callers (`syncStreamsPhase` at line 191 and `reload`/`fetchStreams` routes) can call `computeActivityScoresInternal` themselves after storing streams. This also makes `storeStreams` a pure storage function.

---

## Fix 6: Batch stream reads in computeActivityScoresInternal

**File:** `server/lib/sync.ts`, lines 340-383 (inside `computeActivityScoresInternal`)

**Current code:** Makes 2 separate queries per activity (heartrate + watts streams):
```typescript
const hrDocs = await db.select().from(activityStreams)
  .where(and(
    eq(activityStreams.activityId, activity.id),
    eq(activityStreams.type, "heartrate"),
  ));

// ... later ...

const wattsDocs = await db.select().from(activityStreams)
  .where(and(
    eq(activityStreams.activityId, activity.id),
    eq(activityStreams.type, "watts"),
  ));
```

**Fix:** Fetch both stream types in a single query using `inArray`:
```typescript
import { inArray } from "drizzle-orm";

const streamDocs = await db
  .select()
  .from(activityStreams)
  .where(
    and(
      eq(activityStreams.activityId, activity.id),
      inArray(activityStreams.type, ["heartrate", "watts"]),
    ),
  );

const hrDocs = streamDocs
  .filter((s) => s.type === "heartrate")
  .sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

const wattsDocs = streamDocs
  .filter((s) => s.type === "watts")
  .sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));
```

This cuts the queries per activity from 2 to 1.

---

## Fix 7: Query riderSettings once per batch in computeScoresPhase

**File:** `server/lib/sync.ts`, lines 245-247

**Current code:** Queries `riderSettings` inside the while loop (once per batch):
```typescript
while (true) {
  const batch = ...;
  const settingsDoc = await db.query.riderSettings.findFirst({
    where: eq(riderSettings.athlete, athleteId),
  });
```

**Fix:** Move the settings query before the while loop since rider settings don't change during score computation:
```typescript
const settingsDoc = await db.query.riderSettings.findFirst({
  where: eq(riderSettings.athlete, athleteId),
});

if (!settingsDoc) {
  // No settings, mark as completed and return
  await db.update(syncJobs).set({ status: "completed" }).where(eq(syncJobs.id, syncJobId));
  return;
}

while (true) {
  const batch = ...;
  // Use settingsDoc directly
  for (const activity of batch) {
    await computeActivityScoresInternal(db, activity, settingsDoc);
  }
```

---

## Fix 8: Move activity type filtering to the database

**File:** `server/trpc/routers/activities.ts`, lines 32-47

**Current code:** Fetches ALL activities then filters in JS:
```typescript
const allActivities = await ctx.db
  .select()
  .from(activities)
  .where(eq(activities.athlete, input.athleteId));

const allTypes = [...new Set(allActivities.map((a) => a.type))].sort();

const filtered =
  input.activityTypes && input.activityTypes.length > 0
    ? allActivities.filter((a) => input.activityTypes!.includes(a.type))
    : allActivities;
```

**Fix:** Run two queries — one for types (lightweight), one for filtered activities:
```typescript
import { inArray } from "drizzle-orm";

// 1. Get all types (lightweight query)
const typeRows = await ctx.db
  .selectDistinct({ type: activities.type })
  .from(activities)
  .where(eq(activities.athlete, input.athleteId));
const allTypes = typeRows.map((r) => r.type).sort();

// 2. Get filtered activities
const conditions = [eq(activities.athlete, input.athleteId)];
if (input.activityTypes && input.activityTypes.length > 0) {
  conditions.push(inArray(activities.type, input.activityTypes));
}

const filtered = await ctx.db
  .select()
  .from(activities)
  .where(and(...conditions));
```

---

## Fix 9: Strip mapPolyline at query level when not needed

**File:** `server/trpc/routers/activities.ts`, lines 49-54

**Current code:** Fetches ALL columns including `mapPolyline` (large text), then strips it in JS:
```typescript
return {
  activities: input.includeMap
    ? filtered
    : filtered.map((a) => ({ ...a, mapPolyline: null })),
  allTypes,
};
```

**Fix:** When `includeMap` is false, use a column selection that excludes `mapPolyline`. Since Drizzle doesn't support column exclusion natively, the best approach is to use `.select()` with explicit columns when `includeMap` is false. However, given the number of columns (20+), the simpler approach is to keep the current JS stripping but add it as a note that this is intentional. The real perf issue here is Fix 8 — fetching all activities unfiltered. Once Fix 8 is applied, this becomes less critical.

Alternatively, you can use Drizzle's `getTableColumns` utility:
```typescript
import { getTableColumns } from "drizzle-orm";

const { mapPolyline, ...columnsWithoutMap } = getTableColumns(activities);

const filtered = await ctx.db
  .select(input.includeMap ? undefined : columnsWithoutMap)
  .from(activities)
  .where(and(...conditions));
```

---

## Fix 10: Add missing database index

**File:** `server/db/schema.ts`, line 68-72

**Current indexes:** `(stravaId)`, `(athlete)`, `(athlete, startDate)`

**Add:** An index on `(athlete, areStreamsLoaded)` which is used in both `syncStreamsPhase` and the count query in `syncActivitiesPhase`:

```typescript
(t) => [
  uniqueIndex("activities_strava_id_idx").on(t.stravaId),
  index("activities_athlete_idx").on(t.athlete),
  index("activities_athlete_start_date_idx").on(t.athlete, t.startDate),
  index("activities_athlete_streams_loaded_idx").on(t.athlete, t.areStreamsLoaded), // NEW
],
```

After adding, generate a migration: `npx drizzle-kit generate`

---

## Summary of changes by file

| File | Fixes |
|------|-------|
| `server/lib/sync.ts` | Fix 1, 2, 3, 4, 5, 6, 7 |
| `server/trpc/routers/activities.ts` | Fix 8, 9 |
| `server/db/schema.ts` | Fix 10 |

No frontend changes are needed — the tRPC API shape does not change. The `useActivitiesQuery` and `useActivitiesWithMapQuery` hooks will continue working as-is since the response format remains the same.
