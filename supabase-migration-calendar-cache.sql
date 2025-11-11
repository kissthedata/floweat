-- Calendar Cache Table Migration
-- Purpose: Cache monthly calendar data to eliminate skeleton UI on repeated visits
-- Created: 2025

-- Create calendar_cache table
CREATE TABLE IF NOT EXISTS calendar_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key text NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Ensure one cache entry per user per month
  UNIQUE(user_id, cache_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_cache_user_key
  ON calendar_cache(user_id, cache_key);

CREATE INDEX IF NOT EXISTS idx_calendar_cache_expires
  ON calendar_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE calendar_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own cache
CREATE POLICY "Users can view their own cache"
  ON calendar_cache
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cache"
  ON calendar_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cache"
  ON calendar_cache
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cache"
  ON calendar_cache
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER calendar_cache_updated_at
  BEFORE UPDATE ON calendar_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_cache_updated_at();

-- Function to clean up expired cache (can be called periodically)
CREATE OR REPLACE FUNCTION clean_expired_calendar_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM calendar_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE calendar_cache IS 'Stores cached calendar data per user per month to improve performance';
COMMENT ON COLUMN calendar_cache.cache_key IS 'Format: "YYYY-M" (e.g., "2025-1" for January 2025)';
COMMENT ON COLUMN calendar_cache.data IS 'JSONB array of FoodDiary objects for the month';
COMMENT ON COLUMN calendar_cache.expires_at IS 'Cache expiration timestamp (typically now() + 30 minutes)';
