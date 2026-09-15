import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to run Drizzle migrations");

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
