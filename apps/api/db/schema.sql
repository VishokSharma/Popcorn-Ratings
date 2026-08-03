-- ============================================
-- POPCORN RATINGS DATABASE SCHEMA
-- ============================================
-- 
-- This file defines the structure of our database.
-- Run this ONCE to create tables.
--
-- CONCEPTS:
-- - Tables = Like spreadsheets with rows and columns
-- - Primary Key = Unique identifier (like ID number)
-- - Foreign Key = Reference to another table (like a link)
-- - Constraints = Rules for data (NOT NULL, CHECK, etc.)
-- - Indexes = Speed up searches (like book index)
-- ============================================

-- Drop existing tables if they exist (for clean restart)
-- CASCADE = Also drop anything that depends on these tables
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores user accounts
-- 
-- FIELDS:
-- - id: Unique identifier (auto-generated)
-- - email: Login email (must be unique)
-- - password_hash: Encrypted password (never store plain text!)
-- - name: Display name
-- - created_at: When account was created
-- - updated_at: When account was last modified

CREATE TABLE users (
  -- PRIMARY KEY = Unique identifier for each user
  -- SERIAL = Auto-incrementing number (1, 2, 3, ...)
  -- Alternative: UUID (we'll use SERIAL for simplicity)
  id SERIAL PRIMARY KEY,
  
  -- VARCHAR(255) = String with max 255 characters
  -- UNIQUE = No two users can have same email
  -- NOT NULL = Email is required (can't be empty)
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- password_hash stores encrypted password
  -- We'll use bcrypt (60 character hash)
  password_hash VARCHAR(255) NOT NULL,
  
  -- VARCHAR(100) = Max 100 characters for name
  name VARCHAR(100) NOT NULL,
  
  -- TIMESTAMP = Date + time
  -- DEFAULT NOW() = Automatically set to current time
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- RATINGS TABLE
-- ============================================
-- Stores all episode/movie ratings
--
-- RELATIONSHIP:
-- Each rating belongs to ONE user (user_id foreign key)
-- Each user can have MANY ratings (one-to-many)

CREATE TABLE ratings (
  -- Primary key (unique rating ID)
  id SERIAL PRIMARY KEY,
  
  -- Foreign key linking to users table
  -- INTEGER = Must match users.id type (SERIAL becomes INTEGER)
  -- NOT NULL = Every rating must belong to a user
  -- REFERENCES users(id) = Link to users table
  -- ON DELETE CASCADE = If user deleted, delete their ratings too
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Show information
  show_name VARCHAR(255) NOT NULL,
  episode_number VARCHAR(20),      -- e.g., "S4E9"
  episode_title VARCHAR(255),
  
  -- Rating value
  -- INTEGER = Whole number
  -- CHECK = Validation (rating must be 1-10)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  
  -- Metadata
  platform VARCHAR(50) DEFAULT 'Netflix',  -- Netflix, Prime, etc.
  genre VARCHAR(50),                       -- Drama, Comedy, etc.
  url TEXT,                                -- Full URL to episode
  
  -- TMDB integration (poster art)
  tmdb_id INTEGER,                  -- ID of the show/movie on TMDB
  tmdb_poster_url VARCHAR(500),     -- Full poster image URL
  tmdb_type VARCHAR(50),            -- 'tv' or 'movie'
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
  
  -- Soft delete support (optional - we won't use initially)
  -- deleted_at TIMESTAMP DEFAULT NULL
);

-- ============================================
-- INDEXES
-- ============================================
-- Indexes speed up queries (like book index)
--
-- WHY INDEXES MATTER:
-- Without index:
--   SELECT * FROM ratings WHERE user_id = 5
--   → Database scans ALL rows (slow for millions of rows)
--
-- With index:
--   → Database jumps directly to user_id = 5 (instant)
--
-- TRADE-OFF:
-- + Faster reads
-- - Slower writes (index must be updated)
-- - More disk space

-- Index on user_id for fast lookups by user
-- Most common query: "Get all ratings for user X"
CREATE INDEX idx_ratings_user_id ON ratings(user_id);

-- Index on show_name for searching by show
-- Use case: "Get all ratings for show X"
CREATE INDEX idx_ratings_show_name ON ratings(show_name);

-- Index on created_at for sorting by date
-- Use case: "Get recent ratings"
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

-- Composite index for common query combination
-- Use case: "Get user X's ratings for show Y"
CREATE INDEX idx_ratings_user_show ON ratings(user_id, show_name);

-- Index for TMDB lookups (used when checking if poster already fetched)
CREATE INDEX idx_ratings_tmdb_id ON ratings(tmdb_id);


-- ================================================
-- RECOMMENDATIONS TABLE
-- ================================================
-- Stores the LLM-generated recommendations for each user.
-- Regenerated on-demand (user clicks "Get Recommendations"),
-- overwriting the previous batch for that user.

CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_name VARCHAR(255) NOT NULL,
  reason TEXT,
  rank INTEGER NOT NULL,
  poster_url VARCHAR(500),
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);


-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
-- Insert a test user

INSERT INTO users (email, password_hash, name) VALUES
  ('test@popcornratings.com', '$2a$10$FAKE_HASH_FOR_TESTING', 'Test User');

-- Insert sample ratings
-- Note: user_id = 1 (the test user we just created)

INSERT INTO ratings (user_id, show_name, episode_number, episode_title, rating, platform, genre) VALUES
  (1, 'Breaking Bad', 'S5E14', 'Ozymandias', 10, 'Netflix', 'Drama'),
  (1, 'Stranger Things', 'S4E9', 'The Piggyback', 9, 'Netflix', 'Sci-Fi'),
  (1, 'The Office', 'S5E14', 'Stress Relief', 10, 'Netflix', 'Comedy'),
  (1, 'The Crown', 'S3E5', 'Coup', 7, 'Netflix', 'Drama'),
  (1, 'Mirzapur', 'S2E3', 'Atonement', 8, 'Prime Video', 'Crime');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything worked:

-- Count users
SELECT COUNT(*) as user_count FROM users;

-- Count ratings
SELECT COUNT(*) as rating_count FROM ratings;

-- Show all ratings with user info (JOIN example)
SELECT 
  r.id,
  u.name as user_name,
  r.show_name,
  r.episode_number,
  r.rating,
  r.created_at
FROM ratings r
JOIN users u ON r.user_id = u.id
ORDER BY r.created_at DESC;

-- Average rating per show
SELECT 
  show_name,
  COUNT(*) as episode_count,
  ROUND(AVG(rating), 1) as avg_rating
FROM ratings
GROUP BY show_name
ORDER BY avg_rating DESC;