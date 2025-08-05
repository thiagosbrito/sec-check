import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Check for required environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the connection using DATABASE_URL
const connectionString = process.env.DATABASE_URL;

// Configure connection options based on URL
const isLocalConnection = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const client = postgres(connectionString, { 
  prepare: false,
  // Only use SSL for remote connections
  ...(isLocalConnection ? {} : { ssl: { rejectUnauthorized: false } }),
  // Optimized connection settings for local development
  max: 5,                    // Smaller pool for local dev
  idle_timeout: 300,         // 5 minutes
  connect_timeout: 10,       // 10 seconds
  max_lifetime: 1800,        // 30 minutes max connection lifetime
  debug: process.env.NODE_ENV === 'development', // Enable debug logging in dev
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
  
  const serviceUrlString = serviceUrl.toString();
  const isServiceLocal = serviceUrlString.includes('localhost') || serviceUrlString.includes('127.0.0.1');
  
  const serviceClient = postgres(serviceUrlString, {
    prepare: false,
    ...(isServiceLocal ? {} : { ssl: { rejectUnauthorized: false } }),
    max: 5, // Smaller pool for service operations
  });
  
  return drizzle(serviceClient, { schema });
};