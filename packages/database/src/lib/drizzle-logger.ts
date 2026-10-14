import type { Logger as DrizzleLogger } from "drizzle-orm/logger";
import type { PinoLogger } from "@formkit/logger";

export class DrizzleFastifyLogger implements DrizzleLogger {
    constructor(private readonly logger: PinoLogger) { }

    logQuery(query: string, params: unknown[]): void {
        this.logger.debug({ query, params, timestamp: Date.now() }, "Drizzle query");
    }
}