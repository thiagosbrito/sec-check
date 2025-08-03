import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.omtmvbptfvuxkxdhyeup',
    password: 'l5zupPZrDUNxpFlh',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  verbose: true,
  strict: true,
});