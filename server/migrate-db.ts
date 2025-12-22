import { pool } from "./db.js";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { sql } from "drizzle-orm";
import * as schema from "../shared/schema.js";

async function runMigration() {
  console.log("Starting database migration...");
  
  try {
    const db = drizzle({ client: pool, schema });
    
    // Add new columns to users table
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS interests TEXT[];
    `);
    
    // Add new columns to courses table
    await db.execute(sql`
      ALTER TABLE IF EXISTS courses 
      ADD COLUMN IF NOT EXISTS level TEXT,
      ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `);
    
    // Create modules table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        "order" INTEGER NOT NULL
      );
    `);
    
    // Create lessons table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        "order" INTEGER NOT NULL,
        duration_minutes INTEGER
      );
    `);
    
    // Add lastAccessedAt column to user_courses table
    await db.execute(sql`
      ALTER TABLE IF EXISTS user_courses
      ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP;
    `);
    
    // Create user_lessons table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_lessons (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        progress INTEGER DEFAULT 0,
        last_accessed_at TIMESTAMP
      );
    `);
    
    // Add points column to assignments table
    await db.execute(sql`
      ALTER TABLE IF EXISTS assignments
      ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;
    `);
    
    // Create user_assignments table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        assignment_id INTEGER NOT NULL,
        status TEXT DEFAULT 'not_started',
        submitted_at TIMESTAMP,
        grade INTEGER,
        feedback TEXT
      );
    `);
    
    // Add criteria column to badges table
    await db.execute(sql`
      ALTER TABLE IF EXISTS badges
      ADD COLUMN IF NOT EXISTS criteria TEXT;
    `);
    
    // Create course_recommendations table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS course_recommendations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        recommendations JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create learning_paths table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        goal TEXT NOT NULL,
        estimated_duration_hours INTEGER,
        progress INTEGER DEFAULT 0,
        is_ai_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create learning_path_steps table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_path_steps (
        id SERIAL PRIMARY KEY,
        path_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        "order" INTEGER NOT NULL,
        required BOOLEAN DEFAULT FALSE,
        notes TEXT,
        completed BOOLEAN DEFAULT FALSE
      );
    `);
    
    // Create analytics tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS course_analytics (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        total_enrollments INTEGER NOT NULL DEFAULT 0,
        completion_rate INTEGER DEFAULT 0,
        average_rating INTEGER,
        average_completion_time INTEGER,
        dropoff_rate INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_progress_snapshots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        snapshot_date DATE NOT NULL,
        courses_enrolled INTEGER NOT NULL DEFAULT 0,
        courses_completed INTEGER NOT NULL DEFAULT 0,
        lessons_completed INTEGER NOT NULL DEFAULT 0,
        assignments_completed INTEGER NOT NULL DEFAULT 0,
        total_points INTEGER NOT NULL DEFAULT 0,
        badges_earned INTEGER NOT NULL DEFAULT 0,
        average_grade INTEGER
      );
    `);
    
    // Create Adaptive Learning Reward System tables
    // Create challenges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
        points_reward INTEGER NOT NULL DEFAULT 10,
        xp_reward INTEGER NOT NULL DEFAULT 5,
        badge_id INTEGER REFERENCES badges(id),
        requirements JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP,
        course_id INTEGER REFERENCES courses(id),
        lesson_id INTEGER REFERENCES lessons(id)
      );
    `);
    
    // Create user_challenges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_challenges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        challenge_id INTEGER NOT NULL REFERENCES challenges(id),
        progress INTEGER NOT NULL DEFAULT 0,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMP,
        points_earned INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create user_levels table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_levels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
        level INTEGER NOT NULL DEFAULT 1,
        current_xp INTEGER NOT NULL DEFAULT 0,
        total_xp INTEGER NOT NULL DEFAULT 0,
        next_level_xp INTEGER NOT NULL DEFAULT 100,
        streak INTEGER NOT NULL DEFAULT 0,
        last_activity_date DATE,
        total_points INTEGER NOT NULL DEFAULT 0
      );
    `);
    
    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();