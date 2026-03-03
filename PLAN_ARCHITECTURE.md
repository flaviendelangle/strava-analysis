# Plan: Architecture Improvements

## Context

Next.js app with tRPC, Drizzle ORM, NextAuth (Strava OAuth). All tRPC routes currently use `publicProcedure` with no auth. The codebase has `any` types at the Strava API boundary, no env validation, and some structural issues.

---

## Fix 1: Add authenticated tRPC procedure with session validation

**File:** `server/trpc/index.ts`

**Current code (20 lines):**
```typescript
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { db, type Database } from "../db";

export function createContext() {
  return { db };
}

export type Context = { db: Database };

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
```

**Fix:** Add session to context and create a `protectedProcedure`:

1. Update context to include the session. You'll need to pass the request to `createContext` so NextAuth can extract the session:

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import type { NextApiRequest, NextApiResponse } from "next";

import { db, type Database } from "../db";
import { authOptions } from "../src/pages/api/auth/[...nextauth]";

export async function createContext(opts: { req: NextApiRequest; res: NextApiResponse }) {
  const session = await getServerSession(opts.req, opts.res, authOptions);
  return { db, session };
}

export type Context = {
  db: Database;
  session: Awaited<ReturnType<typeof getServerSession>> | null;
};

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
```

2. Check how `createContext` is wired in `src/pages/api/trpc/[trpc].ts` — it needs to pass `req` and `res`.

3. Update the `authOptions` export in `src/pages/api/auth/[...nextauth].ts` so it can be imported by the server. If it's currently a default export, add a named export for `authOptions`.

4. Gradually migrate routes from `publicProcedure` to `protectedProcedure`. Start with the most sensitive ones:
   - `sync.start` → `protectedProcedure` (triggers background sync)
   - `riderSettings.save` → `protectedProcedure` (modifies user data)
   - `upload.*` → `protectedProcedure` (uploads to Strava)
   - `activities.reload` → `protectedProcedure` (fetches from Strava)

5. For routes that accept `athleteId` as input, add validation that the session's athlete matches:
```typescript
.use(async ({ ctx, input, next }) => {
  if (input.athleteId !== ctx.session.athleteId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
})
```

**Note:** This requires that `session.athleteId` is set during the NextAuth callback. Check the JWT callback in `[...nextauth].ts` to confirm this field is available.

---

## Fix 2: Type the Strava API responses

**File:** `server/lib/strava.ts`

**Current code uses `any` at lines 32, 69, 79:**
```typescript
export function getModelFromStravaActivity(activity: any) { ... }
// ...
return streams.map((s: any) => ({ ... }));
```

**Fix:** Create a types file for Strava API responses:

1. Create `server/lib/stravaTypes.ts`:
```typescript
/** Subset of Strava's DetailedActivity response that we actually use. */
export interface StravaActivity {
  id: number;
  type: string;
  name: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  total_elevation_gain: number;
  average_speed: number;
  average_watts?: number;
  average_cadence?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  max_speed?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  calories?: number;
  moving_time: number;
  elapsed_time: number;
  map?: {
    summary_polyline?: string;
  };
}

/** Strava stream object as returned by the API. */
export interface StravaStream {
  type: string;
  series_type: string;
  original_size: number;
  resolution: string;
  data: number[];
}

/**
 * The streams endpoint can return either:
 * - An array of stream objects (documented format)
 * - An object keyed by stream type (observed in some responses)
 */
export type StravaStreamsResponse = StravaStream[] | Record<string, StravaStream>;
```

2. Update `server/lib/strava.ts`:
```typescript
import type { StravaActivity, StravaStreamsResponse } from "./stravaTypes";

export function getModelFromStravaActivity(activity: StravaActivity) { ... }
export function normalizeStreams(streams: StravaStreamsResponse) { ... }
```

3. Also fix the type cast in `[...nextauth].ts` line 52:
```typescript
// Create a type for the Strava profile
interface StravaProfile {
  firstname?: string;
  lastname?: string;
}

const name = profile
  ? `${(profile as StravaProfile).firstname} ${(profile as StravaProfile).lastname}`
  : undefined;
```

---

## Fix 3: Add environment variable validation

**File:** `server/db/index.ts`, line 6

**Current code:**
```typescript
const connectionString = process.env.DATABASE_URL!;
```

**Fix:** Create `server/env.ts` with Zod validation:

```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  STRAVA_CLIENT_ID: z.string().min(1, "STRAVA_CLIENT_ID is required"),
  STRAVA_CLIENT_SECRET: z.string().min(1, "STRAVA_CLIENT_SECRET is required"),
});

export const env = envSchema.parse(process.env);
```

Then update all usages:
- `server/db/index.ts`: `import { env } from "../env"; const connectionString = env.DATABASE_URL;`
- `src/pages/api/auth/[...nextauth].ts`: use `env.STRAVA_CLIENT_ID`, `env.STRAVA_CLIENT_SECRET`

This gives a clear error at startup instead of cryptic runtime failures.

---

## Fix 4: Split the activities router

**File:** `server/trpc/routers/activities.ts` (288 lines)

**Problem:** Mixes activity listing, stream management, reload functionality, and analytics (power curve) in one file.

**Fix:** Split into focused routers:

1. Keep `server/trpc/routers/activities.ts` for CRUD:
   - `list` — list activities
   - `get` — get single activity

2. Create `server/trpc/routers/activityStreams.ts`:
   - `getStreams` (renamed from `activities.getStreams`)
   - `fetchStreams` (renamed from `activities.fetchStreams`)
   - `reload` (renamed from `activities.reload`)

3. Create `server/trpc/routers/analytics.ts`:
   - `getPowerCurve` (renamed from `activities.getPowerCurve`)

4. Update `server/trpc/root.ts` to merge the new routers:
```typescript
export const appRouter = router({
  activities: activitiesRouter,
  activityStreams: activityStreamsRouter,
  analytics: analyticsRouter,
  // ... existing routers
});
```

5. **Frontend update required:** All call sites need to be updated:
   - `trpc.activities.getStreams.useQuery(...)` → `trpc.activityStreams.getStreams.useQuery(...)`
   - `trpc.activities.fetchStreams.useMutation(...)` → `trpc.activityStreams.fetchStreams.useMutation(...)`
   - `trpc.activities.reload.useMutation(...)` → `trpc.activityStreams.reload.useMutation(...)`
   - `trpc.activities.getPowerCurve.useQuery(...)` → `trpc.analytics.getPowerCurve.useQuery(...)`

   Search the codebase for these patterns:
   - `activities.getStreams`
   - `activities.fetchStreams`
   - `activities.reload`
   - `activities.getPowerCurve`

---

## Fix 5: Separate storeStreams from score computation

**File:** `server/lib/sync.ts`, function `storeStreams` (lines 267-307)

**Problem:** `storeStreams` does three things: stores streams, queries rider settings, and computes scores. This tight coupling makes it hard to test and reason about.

**Fix:** Make `storeStreams` a pure storage function. Move score computation to callers.

1. Simplify `storeStreams`:
```typescript
export async function storeStreams(
  db: Database,
  activityId: number,
  streams: ReturnType<typeof normalizeStreams>,
) {
  await db.delete(activityStreams).where(eq(activityStreams.activityId, activityId));

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

  await db.update(activities).set({ areStreamsLoaded: true }).where(eq(activities.id, activityId));
}
```

2. Update callers to compute scores separately after storing:

In `syncStreamsPhase` (line 191):
```typescript
await storeStreams(db, activity.id, normalized);
// Score computation happens in Phase 3, no need to do it here during sync
```

In `activities.reload` route (line 180):
```typescript
await storeStreams(ctx.db, activity.id, normalized);
// Recompute scores for this activity
const settingsDoc = await ctx.db.query.riderSettings.findFirst({
  where: eq(riderSettings.athlete, input.athleteId),
});
if (settingsDoc) {
  const updatedActivity = await ctx.db.query.activities.findFirst({
    where: eq(activities.id, activity.id),
  });
  if (updatedActivity) {
    await computeActivityScoresInternal(ctx.db, updatedActivity, settingsDoc);
  }
}
```

In `activities.fetchStreams` route (line 215), same pattern.

---

## Summary of changes by file

| File | Fix |
|------|-----|
| `server/trpc/index.ts` | Fix 1: add protectedProcedure |
| `src/pages/api/auth/[...nextauth].ts` | Fix 1: export authOptions; Fix 2: type profile |
| `src/pages/api/trpc/[trpc].ts` | Fix 1: pass req/res to createContext |
| `server/lib/stravaTypes.ts` | Fix 2: new file with Strava API types |
| `server/lib/strava.ts` | Fix 2: use typed interfaces |
| `server/env.ts` | Fix 3: new file with env validation |
| `server/db/index.ts` | Fix 3: use validated env |
| `server/trpc/routers/activities.ts` | Fix 4: keep only list/get |
| `server/trpc/routers/activityStreams.ts` | Fix 4: new router |
| `server/trpc/routers/analytics.ts` | Fix 4: new router |
| `server/trpc/root.ts` | Fix 4: register new routers |
| Frontend call sites (search for `activities.getStreams`, etc.) | Fix 4: update tRPC paths |
| `server/lib/sync.ts` | Fix 5: simplify storeStreams |
| `server/trpc/routers/activities.ts` (reload, fetchStreams) | Fix 5: compute scores after store |
