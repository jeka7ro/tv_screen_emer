-- Migration: Add created_by and location_ids support
ALTER TABLE screens ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE digital_menus ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE happy_hour_schedules ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE happy_hour_schedules ADD COLUMN IF NOT EXISTS location_ids TEXT[] DEFAULT '{}';
