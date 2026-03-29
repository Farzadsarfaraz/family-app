import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

const envCandidates = [
  path.resolve(process.cwd(), "server/.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
];

for (const candidate of envCandidates) {
  dotenv.config({ path: candidate });
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  CLIENT_ORIGIN: z.string().default("*"),
});

export const env = envSchema.parse(process.env);
