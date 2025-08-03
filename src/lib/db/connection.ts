import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Check for required environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the connection using DATABASE_URL
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  prepare: false,
  // Enable SSL for security
  ssl: { rejectUnauthorized: false },
  // Connection pool settings for security
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the database instance
export const db = drizzle(client, { schema });

// Export the client for direct queries if needed
export { client };

// Create a service role connection for backend operations that bypass RLS
export const createServiceClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are required for service operations');
  }
  
  // Create service role connection string
  const serviceUrl = new URL(process.env.DATABASE_URL!);
  serviceUrl.password = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const serviceClient = postgres(serviceUrl.toString(), {
    prepare: false,
    ssl: { rejectUnauthorized: false },
    max: 5, // Smaller pool for service operations
  });
  
  return drizzle(serviceClient, { schema });
};