import { neon } from '@neondatabase/serverless';

let sqlClient = null;

export function getSql() {
  if (sqlClient) {
    return sqlClient;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  sqlClient = neon(connectionString);
  return sqlClient;
}

export async function ensureFirebaseBridgeTables() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS firebase_user_links (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      firebase_uid TEXT NOT NULL UNIQUE,
      email TEXT,
      display_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_uploads (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      firebase_uid TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT,
      content_type TEXT,
      size_bytes BIGINT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_firebase_user_links_uid ON firebase_user_links(firebase_uid)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id)`;
}
