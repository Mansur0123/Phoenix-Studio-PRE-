-- ============================================================
-- Phoenix Studio – Datenbank Setup
-- In MySQL Workbench einfach diesen Script ausführen.
-- ============================================================

DROP DATABASE IF EXISTS phoenix;
CREATE DATABASE phoenix
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE phoenix;

-- ------------------------------------------------------------
-- USERS
-- Speichert die Google-Accounts der User.
-- google_id ist die eindeutige ID die Google für jeden User vergibt.
-- ------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  -- google_id ist NULL bei lokalen Email/Passwort-Accounts
  google_id     VARCHAR(64) UNIQUE,
  -- password_hash ist NULL bei Google-Accounts
  password_hash VARCHAR(255),
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  picture       VARCHAR(500),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_google_id (google_id),
  INDEX idx_email (email)
);

-- ------------------------------------------------------------
-- WATCHLISTS
-- Ein User kann mehrere Watchlists haben (z.B. "Filme",
-- "Serien zum schauen", "Lieblinge", ...).
-- Beim Login wird automatisch eine Default-Watchlist angelegt.
-- ------------------------------------------------------------
CREATE TABLE watchlists (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  name        VARCHAR(120) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- ------------------------------------------------------------
-- WATCHLIST_ITEMS
-- Filme/Serien innerhalb einer Watchlist.
-- tmdb_id + media_type identifizieren einen Film/eine Serie bei TMDB.
-- Damit kein Film doppelt drin ist: UNIQUE (watchlist_id, tmdb_id, media_type).
-- ------------------------------------------------------------
CREATE TABLE watchlist_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  watchlist_id  INT NOT NULL,
  tmdb_id       INT NOT NULL,
  media_type    ENUM('movie', 'tv') NOT NULL,
  title         VARCHAR(300) NOT NULL,
  poster_path   VARCHAR(255),
  release_year  VARCHAR(8),
  added_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_item_per_list (watchlist_id, tmdb_id, media_type)
);

-- ------------------------------------------------------------
-- REVIEWS
-- Die User-Bewertungen (vorher in localStorage gespeichert).
-- Ein User kann pro Film/Serie nur eine Review haben.
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  tmdb_id     INT NOT NULL,
  media_type  ENUM('movie', 'tv') NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 10),
  review_text TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_review (user_id, tmdb_id, media_type)
);

-- ------------------------------------------------------------
-- KONTROLLE
-- ------------------------------------------------------------
SHOW TABLES;
