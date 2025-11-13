-- Migration: Add demographics and contact info to survey_responses
-- Date: 2025-11-13
-- Description:
--   1. Change q10 from TEXT to TEXT[] for multi-select support
--   2. Add demographics fields (gender, age_range, occupation)
--   3. Add contact info fields (wants_launch_notification, contact_email, contact_phone)

-- Add new columns to survey_responses table
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS age_range TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS wants_launch_notification BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Migrate existing q10 data from TEXT to TEXT[] (if any data exists)
-- This handles backward compatibility for existing survey responses
DO $$
BEGIN
  -- Check if q10 column is TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses'
    AND column_name = 'q10'
    AND data_type = 'text'
  ) THEN
    -- Create a temporary column to hold the new array data
    ALTER TABLE survey_responses ADD COLUMN q10_temp TEXT[];

    -- Convert existing single values to arrays
    UPDATE survey_responses
    SET q10_temp = CASE
      WHEN q10 IS NOT NULL AND q10 != '' THEN ARRAY[q10]
      ELSE NULL
    END;

    -- Drop the old column and rename the new one
    ALTER TABLE survey_responses DROP COLUMN q10;
    ALTER TABLE survey_responses RENAME COLUMN q10_temp TO q10;
  END IF;
END $$;

-- Add validation constraint for email format (optional but recommended)
ALTER TABLE survey_responses
  DROP CONSTRAINT IF EXISTS check_email_format;

ALTER TABLE survey_responses
  ADD CONSTRAINT check_email_format
    CHECK (
      contact_email IS NULL OR
      contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );

-- Add comments for documentation
COMMENT ON COLUMN survey_responses.gender IS '성별 (남성, 여성)';
COMMENT ON COLUMN survey_responses.age_range IS '연령대 (10대, 20대, 30대, 40대, 50대, 60대 이상)';
COMMENT ON COLUMN survey_responses.occupation IS '직업 (학생, 직장인, 자영업, 전문직, 주부, 무직, 기타)';
COMMENT ON COLUMN survey_responses.wants_launch_notification IS '정식 출시 알림 수신 여부';
COMMENT ON COLUMN survey_responses.contact_email IS '연락 이메일 (선택)';
COMMENT ON COLUMN survey_responses.contact_phone IS '연락 전화번호 (선택)';
COMMENT ON COLUMN survey_responses.q10 IS '재사용 상황 (다중 선택 가능, TEXT[])';

-- Note: All new columns are nullable (optional) to maintain backward compatibility
-- and allow users to skip these questions if desired.
