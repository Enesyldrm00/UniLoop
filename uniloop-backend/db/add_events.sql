-- Create event status enum
CREATE TYPE event_status AS ENUM ('open', 'full', 'completed', 'cancelled');

-- Create events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    reward_per_participant INTEGER NOT NULL CHECK (reward_per_participant > 0),
    total_locked_amount INTEGER NOT NULL CHECK (total_locked_amount >= 0),
    status event_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create event participants table
CREATE TABLE event_participants (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
);
