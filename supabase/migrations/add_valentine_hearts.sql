-- Add Valentine hearts effect columns to screens table
ALTER TABLE screens 
ADD COLUMN IF NOT EXISTS valentine_hearts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS valentine_hearts_intensity VARCHAR(10) DEFAULT 'medium';
