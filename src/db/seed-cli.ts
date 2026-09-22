import "dotenv/config";
import { ensureSeeded } from "@/db/seed";
import { pool } from "@/db";

ensureSeeded()
  .then(() => console.log("✅ Seed complete"))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => pool.end());
