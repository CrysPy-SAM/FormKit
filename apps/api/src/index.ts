import "dotenv/config";

import server from "./server.js";
import { env } from "./env.js";

async function main() {
  try {
    const PORT = env.PORT;
    const HOST = process.env.HOST ?? "0.0.0.0";
    await server.listen({ port: PORT, host: HOST });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
for (const signal of signals) {
  process.on(signal, async () => {
    try {
      await server.close();
      process.exit(0);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  });
}

await main();