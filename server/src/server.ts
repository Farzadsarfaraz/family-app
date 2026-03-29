import { app } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";

const start = async () => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
