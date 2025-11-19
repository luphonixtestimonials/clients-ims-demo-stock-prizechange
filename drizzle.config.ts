
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.mysql.ts",
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl
  },
});
