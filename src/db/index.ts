import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import * as dotenv from 'dotenv'

// Only load .env.local if it exists (for local development)
try {
  dotenv.config({ path: '.env.local' })
} catch {
  // File doesn't exist, which is fine for Replit
}

const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })