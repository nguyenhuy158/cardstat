-- Better Auth tables. Shape copied from the drizzle schema so the drizzleAdapter
-- maps onto them without a translation layer: text ids, integer timestamps.
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT false,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  username TEXT,
  display_username TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS user_email_unique ON user (email);
CREATE UNIQUE INDEX IF NOT EXISTS user_username_unique ON user (username);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS session_token_unique ON session (token);
CREATE INDEX IF NOT EXISTS session_user_id_idx ON session (user_id);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS account_user_id_idx ON account (user_id);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

-- Owner of a transaction. Nullable because SQLite cannot add a NOT NULL column
-- to a table that already has rows; every query filters `user_id = ?`, so rows
-- imported before login existed are simply invisible until backfilled.
ALTER TABLE cardstat_transactions ADD COLUMN user_id TEXT;

CREATE INDEX IF NOT EXISTS cardstat_transactions_user_id_idx ON cardstat_transactions (user_id);
