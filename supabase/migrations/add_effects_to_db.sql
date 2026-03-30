-- Migrate Snow and Custom Text effects from localStorage to database
-- These columns allow effects to be visible across all browsers, previews, and TV screens

ALTER TABLE screens
ADD COLUMN IF NOT EXISTS snow_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS snow_intensity VARCHAR(10) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS custom_text_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_text_content TEXT,
ADD COLUMN IF NOT EXISTS custom_text_position VARCHAR(20) DEFAULT 'bottom-center',
ADD COLUMN IF NOT EXISTS custom_text_size VARCHAR(5) DEFAULT 'md',
ADD COLUMN IF NOT EXISTS custom_text_color VARCHAR(20) DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS custom_text_has_background BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_text_bg_color VARCHAR(20) DEFAULT '#000000';
