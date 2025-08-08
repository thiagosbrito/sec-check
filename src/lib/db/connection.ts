import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import * as schema from './schema';

// Get DATABASE_URL with fallback for build time
const connectionString = process.env.DATABASE_URL ?? '';

// Check for required environment variable at runtime
if (!connectionString && process.env.NODE_ENV !== 'production') {
  throw new Error('DATABASE_URL environment variable is required');
}

// Only log and create connections if DATABASE_URL is available
let client: Sql;
let dbInstance: ReturnType<typeof drizzle>;

if (connectionString) {
  console.log('App DB target:', new URL(connectionString).host);

  client = postgres(connectionString, { 
    prepare: false,
    // Enable SSL for security
    ssl: { rejectUnauthorized: false },
    // Connection pool settings for security
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // Create the database instance
  dbInstance = drizzle(client, { schema });
}

// Export the database instance with runtime check
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!connectionString && process.env.NODE_ENV !== 'production') {
      throw new Error('DATABASE_URL environment variable is required');
    }
    if (!client || !dbInstance) {
      throw new Error('Database connection not initialized');
    }
    return (dbInstance as ReturnType<typeof drizzle>)[prop as keyof ReturnType<typeof drizzle>];
  }
});

// Export the client for direct queries if needed
export { client };

// Create a service role connection for backend operations that bypass RLS
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const databaseUrl = process.env.DATABASE_URL ?? '';
  
  if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
    throw new Error('Supabase environment variables are required for service operations');
  }
  
  // Create service role connection string
  const serviceUrl = new URL(databaseUrl);
  serviceUrl.password = serviceRoleKey;
  
  const serviceUrlString = serviceUrl.toString();
  const isServiceLocal = serviceUrlString.includes('localhost') || serviceUrlString.includes('127.0.0.1');
  
  const serviceClient = postgres(serviceUrlString, {
    prepare: false,
    ...(isServiceLocal ? {} : { ssl: { rejectUnauthorized: false } }),
    max: 5, // Smaller pool for service operations
  });
  
  return drizzle(serviceClient, { schema });
};