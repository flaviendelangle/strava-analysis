import type { InferSelectModel } from "drizzle-orm";

import type {
  activities,
  activityStreams,
  athletes,
  riderSettings,
  syncJobs,
} from "./schema";

export type Athlete = InferSelectModel<typeof athletes>;
export type Activity = InferSelectModel<typeof activities>;
export type ActivityStream = InferSelectModel<typeof activityStreams>;
export type RiderSettingsRow = InferSelectModel<typeof riderSettings>;
export type SyncJob = InferSelectModel<typeof syncJobs>;
