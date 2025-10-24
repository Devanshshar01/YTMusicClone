/*
  # Create Authentication Tables

  1. New Tables
    - `users`
      - `id` (text, primary key) - User unique identifier
      - `name` (text, nullable) - User's display name
      - `email` (text, unique) - User's email address
      - `email_verified` (timestamptz, nullable) - Email verification timestamp
      - `password` (text) - Hashed password
      - `image` (text, nullable) - Profile image URL
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `accounts`
      - `id` (text, primary key) - Account unique identifier
      - `user_id` (text, foreign key) - Reference to users table
      - `type` (text) - Account type
      - `provider` (text) - OAuth provider name
      - `provider_account_id` (text) - Provider's account ID
      - `refresh_token` (text, nullable) - OAuth refresh token
      - `access_token` (text, nullable) - OAuth access token
      - `expires_at` (bigint, nullable) - Token expiration timestamp
      - `token_type` (text, nullable) - Type of token
      - `scope` (text, nullable) - OAuth scope
      - `id_token` (text, nullable) - OpenID Connect ID token
      - `session_state` (text, nullable) - Session state
    
    - `sessions`
      - `id` (text, primary key) - Session unique identifier
      - `session_token` (text, unique) - Session token
      - `user_id` (text, foreign key) - Reference to users table
      - `expires` (timestamptz) - Session expiration time
    
    - `verification_tokens`
      - `identifier` (text) - User identifier (email)
      - `token` (text, unique) - Verification token
      - `expires` (timestamptz) - Token expiration time

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for service role to manage sessions
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  password TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create accounts table for OAuth
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT accounts_provider_provider_account_id_key UNIQUE (provider, provider_account_id)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Accounts policies
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Sessions policies (service role only)
CREATE POLICY "Service role can manage sessions"
  ON sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verification tokens policies (public for verification process)
CREATE POLICY "Anyone can read verification tokens"
  ON verification_tokens FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON sessions(session_token);