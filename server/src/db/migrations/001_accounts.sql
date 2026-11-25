-- Accounts, sessions and password resets.

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Always trimmed and lower-case, so one address is one account.
  email text NOT NULL,
  name text NOT NULL,
  -- scrypt$N$r$p$salt$hash, never the password itself.
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_normalized CHECK (email = lower(btrim(email)) AND email <> ''),
  CONSTRAINT users_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 80)
);

CREATE UNIQUE INDEX users_email_key ON users (email);

-- A session is a random token that the app keeps. Only a hash of it is stored, so a copy of the
-- database cannot be used to act as a user.
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- A single-use token for choosing a new password. Only a hash is stored here too.
CREATE TABLE password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE INDEX password_resets_user_id_idx ON password_resets (user_id);
