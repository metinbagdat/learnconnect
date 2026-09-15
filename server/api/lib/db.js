/**
 * Database connection for Vercel serverless.
 * Uses Neon serverless driver when DATABASE_URL is set.
 */
import { neon } from '@neondatabase/serverless';

let _sql = null;

export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (_sql) return _sql;
  _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

export function hasDb() {
  return !!process.env.DATABASE_URL;
}
