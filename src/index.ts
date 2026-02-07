import "reflect-metadata";
import { KEEP_IT_DATABASE_CONFIG } from "src/config/env";
import * as keepItEntities from "./entity/keep-it";
import { createDatabaseConnection } from "./remotes/database";
import { createKeepItBatchBot } from "./createKeepItBatchBot";
import { GlobalErrorHandler } from "./util/error/global-error-handler";

process.on("uncaughtException", async (error) => {
  await GlobalErrorHandler.handleError(error, "UncaughtException");
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  await GlobalErrorHandler.handleError(error, "UnhandledRejection", {
    promise,
  });
  process.exit(1);
});

async function main() {
  try {
    const keepItDatabase = await createDatabaseConnection(
      KEEP_IT_DATABASE_CONFIG(),
      keepItEntities,
    );
    const start = createKeepItBatchBot(keepItDatabase);
    await start();
  } catch (error) {
    await GlobalErrorHandler.handleError(error as Error, "main");
    process.exit(1);
  }
}

main();
