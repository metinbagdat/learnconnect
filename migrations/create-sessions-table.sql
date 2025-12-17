-- Migration: Create sessions table for PostgreSQL session store
-- This table is used by connect-pg-simple to store Express sessions
-- Run this migration before deploying the session storage update

-- Create the session table
-- connect-pg-simple will create this automatically if createTableIfMissing: true
-- But we include it here for manual migration if needed

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

-- Create primary key
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Create index on expire column for efficient cleanup of expired sessions
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Grant necessary permissions (adjust as needed for your database user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "session" TO your_app_user;

COMMENT ON TABLE "session" IS 'Express session store table managed by connect-pg-simple';

