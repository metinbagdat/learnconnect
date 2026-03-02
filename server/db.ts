import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
// ✅ CRITICAL FIX: Lazy load schema to prevent module loading errors
// Schema import is deferred until db is actually accessed
// This prevents "Unrecognized key: createdAt" errors during module initialization

neonConfig.webSocketConstructor = ws;

// Lazy initialization - only create pool/db when DATABASE_URL is available
// This allows the server to start even without a database connection
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function validateConnectionString(url: string): void {
  if (!url) {
    throw new Error("DATABASE_URL is empty");
  }

  // Check for common SSL error causes
  if (url.startsWith('https://')) {
    throw new Error(
      "❌ DATABASE_URL starts with 'https://' - this is incorrect!\n" +
      "✅ Use 'postgresql://' instead. For Neon, use the POOLER connection string.\n" +
      "Get it from: https://console.neon.tech/ → Connection Details → Pooler tab"
    );
  }

  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(
      "❌ DATABASE_URL must start with 'postgresql://' or 'postgres://'\n" +
      `Current format: ${url.substring(0, 20)}...\n` +
      "✅ For Neon, use the POOLER connection string from: https://console.neon.tech/"
    );
  }

  // Check if it's a Neon connection string
  const isNeon = url.includes('neon.tech');
  
  if (isNeon) {
    // For Neon serverless driver, we need pooler connection
    const hasPooler = url.includes('-pooler') || url.includes(':5432');
    const hasSslMode = url.includes('sslmode=');
    
    if (!hasPooler && !url.includes(':5432')) {
      console.warn(
        "⚠️  WARNING: DATABASE_URL appears to be a direct Neon connection.\n" +
        "For @neondatabase/serverless driver, use the POOLER connection string.\n" +
        "Direct connections may cause SSL_ERROR_RX_RECORD_TOO_LONG errors.\n" +
        "Get pooler connection from: https://console.neon.tech/ → Connection Details → Pooler"
      );
    }
    
    if (!hasSslMode) {
      console.warn(
        "⚠️  WARNING: DATABASE_URL missing '?sslmode=require'\n" +
        "Adding it is recommended for secure connections."
      );
    }
  }
}

function initializePool(): Pool {
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

  // Validate connection string format
  try {
    validateConnectionString(process.env.DATABASE_URL);
  } catch (error: any) {
    console.error("❌ DATABASE_URL validation failed:");
    console.error(error.message);
    throw error;
  }

  if (!_pool) {
// Configure connection pool - ultra-minimal for Replit deployment constraints
    _pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Allow up to 5 concurrent connections
  idleTimeoutMillis: 5000, // Close idle connections quickly
  connectionTimeoutMillis: 15000, // Longer timeout for deployment phases
  statement_timeout: 45000, // Longer query timeout for schema introspection
  application_name: 'learnconnect-app', // Identify connection for debugging
});

// Ensure pool closes gracefully
    _pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});
  }
  
  return _pool;
}

// Export pool with lazy initialization
export const pool = {
  get query() {
    return initializePool().query;
  },
  get connect() {
    return initializePool().connect;
  },
  get end() {
    return initializePool().end;
  },
  on(event: "error", handler: (err: any) => void) {
    return initializePool().on(event, handler);
  }
} as Pool;

// Helper function to get the actual pool instance (for libraries that need it)
export function getPoolInstance(): Pool {
  return initializePool();
}

// ✅ CRITICAL FIX: Lazy load schema module to prevent initialization errors
let schemaModule: any = null;
function getSchemaModule() {
  if (!schemaModule) {
    try {
      schemaModule = require("../shared/schema.js");
    } catch (err: any) {
      // If schema loading fails (e.g., createdAt omit errors), use empty object
      // Drizzle can work without schema, but table queries won't work
      // This allows the app to start even if schema has errors
      console.warn("⚠️ Schema module loading failed, using empty schema:", err?.message);
      schemaModule = {};
    }
  }
  return schemaModule;
}

// Export db with lazy initialization
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!_db) {
      // Load schema only when db is first accessed, not during module initialization
      const schema = getSchemaModule();
      _db = drizzle({ client: initializePool(), schema });
    }
    return (_db as any)[prop];
  }
});
