import { router } from "./index";
import { activitiesRouter } from "./routers/activities";
import { activityStreamsRouter } from "./routers/activityStreams";
import { analyticsRouter } from "./routers/analytics";
import { athletesRouter } from "./routers/athletes";
import { riderSettingsRouter } from "./routers/riderSettings";
import { syncRouter } from "./routers/sync";
import { uploadRouter } from "./routers/upload";

export const appRouter = router({
  activities: activitiesRouter,
  activityStreams: activityStreamsRouter,
  analytics: analyticsRouter,
  athletes: athletesRouter,
  riderSettings: riderSettingsRouter,
  sync: syncRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
