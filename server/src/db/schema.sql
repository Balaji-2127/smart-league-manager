-- ─────────────────────────────────────────────────────────────────────────────
-- Smart League Manager – PostgreSQL Schema
-- Run: node src/db/migrate.js
-- Safe to re-run – drops all tables first then recreates them.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop tables in reverse dependency order to avoid FK conflicts
DROP TABLE IF EXISTS scores       CASCADE;
DROP TABLE IF EXISTS matches      CASCADE;
DROP TABLE IF EXISTS players      CASCADE;
DROP TABLE IF EXISTS teams        CASCADE;
DROP TABLE IF EXISTS tournaments  CASCADE;
DROP TABLE IF EXISTS users        CASCADE;

-- ─── 1. users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'viewer'
                              CHECK (role IN ('admin','captain','player','viewer')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ─── 2. teams ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  captain_id  INT          REFERENCES users(id) ON DELETE SET NULL,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_captain ON teams(captain_id);

-- ─── 3. players ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id              SERIAL PRIMARY KEY,
  user_id         INT         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  team_id         INT         REFERENCES teams(id) ON DELETE SET NULL,
  role            VARCHAR(30) DEFAULT 'batsman'
                              CHECK (role IN ('batsman','bowler','all-rounder','wicket-keeper')),
  photo_url       TEXT,
  runs            INT         NOT NULL DEFAULT 0,
  wickets         INT         NOT NULL DEFAULT 0,
  matches_played  INT         NOT NULL DEFAULT 0,
  batting_avg     NUMERIC(5,2),
  strike_rate     NUMERIC(6,2),
  economy         NUMERIC(5,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_user   ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_team   ON players(team_id);

-- ─── 4. tournaments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  year        SMALLINT     NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'upcoming'
                           CHECK (status IN ('upcoming','ongoing','completed')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 5. matches ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id              SERIAL PRIMARY KEY,
  tournament_id   INT         REFERENCES tournaments(id) ON DELETE CASCADE,
  team1_id        INT         NOT NULL REFERENCES teams(id),
  team2_id        INT         NOT NULL REFERENCES teams(id),
  scheduled_date  TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'upcoming'
                              CHECK (status IN ('upcoming','live','completed','cancelled')),
  winner_id       INT         REFERENCES teams(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_teams CHECK (team1_id <> team2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status     ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date       ON matches(scheduled_date);

-- ─── 6. scores ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id          SERIAL PRIMARY KEY,
  match_id    INT         NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id     INT         NOT NULL REFERENCES teams(id),
  runs        INT         NOT NULL DEFAULT 0,
  wickets     INT         NOT NULL DEFAULT 0 CHECK (wickets BETWEEN 0 AND 10),
  overs       NUMERIC(4,1) NOT NULL DEFAULT 0,
  extras      INT         NOT NULL DEFAULT 0,
  updated_by  INT         REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_match ON scores(match_id);
