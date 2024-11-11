import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: './src/db/schema.ts', 
  dbCredentials: {
    url: process.env.DATABASE_URL as string
  },
  verbose: true ,
  out: './src/db/migrations'
})
