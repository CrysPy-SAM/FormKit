import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env.js";
import { createLogger } from "@formkit/logger";
import { DrizzleFastifyLogger } from "./lib/drizzle-logger.js";
import { relations } from "./models/relations.js";

const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

const logger = createLogger({ service: "db" });

export const db = drizzle({
    client: pool,
    relations,
    logger: env.NODE_ENV === "production" ? false : new DrizzleFastifyLogger(logger),
});

export * from "drizzle-orm";