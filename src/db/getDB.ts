import { drizzle } from "drizzle-orm/libsql";

import { createClient } from "@libsql/client";

import * as schema from "./schema";

export const getDB = () =>
  drizzle(
    createClient({
      url: "libsql://strava-analysis-flaviendelangle.turso.io",
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    {
      schema,
    },
  );

export type Database = ReturnType<typeof getDB>;
