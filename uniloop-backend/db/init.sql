-- ============================================================
-- UniLoop — Veritabanı Şeması v2
-- ============================================================

-- ENUM TANIMLARI
-- ------------------------------------------------------------
CREATE TYPE campus_location AS ENUM (
    'muhendislik',
    'merkez_kantin',
    'yabanci_dil',
    'sosyal_yasam',
    'kutuphane'
);

CREATE TYPE task_type AS ENUM (
    'skill_exchange',
    'courier_request',
    'courier_offer',
    'second_hand'
);

CREATE TYPE task_status AS ENUM (
    'open',
    'assigned',
    'in_escrow',
    'completed',
    'cancelled',
    'disputed'
);

CREATE TYPE pool_status AS ENUM (
    'open',
    'full',
    'closed'
);

CREATE TYPE transaction_type AS ENUM (
    'topup',
    'earn',
    'spend',
    'escrow_lock',
    'escrow_release',
    'refund'
);

CREATE TYPE escrow_status AS ENUM (
    'locked',
    'buyer_approved',
    'seller_approved',
    'released',
    'refunded'
);

-- ============================================================
-- TABLOLAR
-- ============================================================

-- 1. KULLANICILAR
CREATE TABLE users (
    id               SERIAL PRIMARY KEY,
    email            VARCHAR(255) UNIQUE NOT NULL,
    password_hash    TEXT NOT NULL,
    full_name        VARCHAR(150) NOT NULL,
    is_edu_verified  BOOLEAN DEFAULT FALSE,
    rating_average   NUMERIC(3,2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
    rating_count     INTEGER DEFAULT 0 CHECK (rating_count >= 0),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_edu_email CHECK (email LIKE '%.edu.tr')
);

-- 2. KULLANICI PROFİLİ
CREATE TABLE user_profiles (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio               TEXT,
    gpa               NUMERIC(3,2) CHECK (gpa >= 0.00 AND gpa <= 4.00),
    department        VARCHAR(100),
    year_of_study     SMALLINT CHECK (year_of_study >= 1 AND year_of_study <= 6),
    certifications    JSONB DEFAULT '[]'::jsonb,
    achievements      JSONB DEFAULT '[]'::jsonb,
    credibility_score INTEGER DEFAULT 0 CHECK (credibility_score >= 0 AND credibility_score <= 100),
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. İLETİŞİM BİLGİLERİ
CREATE TABLE user_contacts (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number      VARCHAR(20),
    instagram_handle  VARCHAR(100),
    twitter_handle    VARCHAR(100),
    linkedin_url      TEXT,
    show_phone        BOOLEAN DEFAULT FALSE,
    show_instagram    BOOLEAN DEFAULT TRUE,
    show_linkedin     BOOLEAN DEFAULT TRUE,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CÜZDANLAR
CREATE TABLE wallets (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance          INTEGER DEFAULT 0 CHECK (balance >= 0),
    total_topup_tl   INTEGER DEFAULT 0 CHECK (total_topup_tl >= 0),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CÜZDAN İŞLEM GEÇMİŞİ
CREATE TABLE transactions (
    id               SERIAL PRIMARY KEY,
    wallet_id        INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount           INTEGER NOT NULL,
    type             transaction_type NOT NULL,
    description      TEXT,
    related_task_id  INTEGER,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. GÖREVLER / İLANLAR
CREATE TABLE tasks (
    id                SERIAL PRIMARY KEY,
    creator_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    task_type         task_type NOT NULL DEFAULT 'skill_exchange',
    status            task_status NOT NULL DEFAULT 'open',
    reward_kredi      INTEGER NOT NULL CHECK (reward_kredi > 0),
    location          campus_location,
    from_location     campus_location,
    to_location       campus_location,
    image_url         VARCHAR(255),
    is_auto_generated BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at        TIMESTAMP
);

-- 7. ESCROW / EMANET SİSTEMİ
CREATE TABLE escrows (
    id               SERIAL PRIMARY KEY,
    task_id          INTEGER UNIQUE NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    buyer_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount           INTEGER NOT NULL CHECK (amount > 0),
    status           escrow_status NOT NULL DEFAULT 'locked',
    buyer_approved   BOOLEAN DEFAULT FALSE,
    seller_approved  BOOLEAN DEFAULT FALSE,
    locked_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at      TIMESTAMP
);

-- 8. HAVUZLAR
CREATE TABLE pools (
    id               SERIAL PRIMARY KEY,
    creator_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    location         campus_location,
    max_capacity     INTEGER NOT NULL CHECK (max_capacity > 0),
    current_capacity INTEGER DEFAULT 0 CHECK (current_capacity >= 0),
    total_cost       INTEGER NOT NULL CHECK (total_cost > 0),
    status           pool_status NOT NULL DEFAULT 'open',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_capacity CHECK (current_capacity <= max_capacity)
);

-- 9. HAVUZ ÜYELERİ
CREATE TABLE pool_members (
    pool_id          INTEGER NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paid_amount      INTEGER NOT NULL CHECK (paid_amount > 0),
    joined_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pool_id, user_id)
);

-- 10. MESAJLAR
CREATE TABLE messages (
    id               SERIAL PRIMARY KEY,
    sender_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text     TEXT NOT NULL,
    related_task_id  INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    is_read          BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. PUANLAMALAR
CREATE TABLE reviews (
    id               SERIAL PRIMARY KEY,
    task_id          INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating           SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment          TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (task_id, reviewer_id)
);

-- ============================================================
-- İNDEKSLER
-- ============================================================
CREATE INDEX idx_tasks_location      ON tasks(location);
CREATE INDEX idx_tasks_status        ON tasks(status);
CREATE INDEX idx_tasks_type          ON tasks(task_type);
CREATE INDEX idx_tasks_creator       ON tasks(creator_id);
CREATE INDEX idx_messages_receiver   ON messages(receiver_id, is_read);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_pools_status        ON pools(status);
CREATE INDEX idx_pools_location      ON pools(location);
