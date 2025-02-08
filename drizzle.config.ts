import { config } from "dotenv";
import { Config } from "drizzle-kit";

config({ path: ".env" });

export default {
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  driver: "turso",
  dbCredentials: {
    url: "libsql://strava-analysis-flaviendelangle.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
