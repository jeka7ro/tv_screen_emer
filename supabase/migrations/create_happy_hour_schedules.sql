-- Migration: Create happy_hour_schedules table
-- Description: Table for storing time-based content schedules (Happy Hour events)

CREATE TABLE IF NOT EXISTS happy_hour_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    screen_ids TEXT[] NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    content_type VARCHAR(50) CHECK (content_type IN ('single_content', 'playlist')),
    content_id TEXT,
    playlist_id TEXT,
    active BOOLEAN DEFAULT true,
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_happy_hour_active ON happy_hour_schedules(active);
CREATE INDEX IF NOT EXISTS idx_happy_hour_city ON happy_hour_schedules(city);
CREATE INDEX IF NOT EXISTS idx_happy_hour_time ON happy_hour_schedules(start_time, end_time);
