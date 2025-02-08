import { migrate } from "drizzle-orm/libsql/migrator";

import { getDB } from "~/db/getDB";

async function main() {
  const db = getDB();

  console.log("Running migrations");

  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  console.log("Migrated successfully");

  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed");
  console.error(e);
  process.exit(1);
});
