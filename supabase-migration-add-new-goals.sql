-- Migration: Add new eating goals (muscle, skin)
-- Date: 2025-11-13
-- Description: Extends eating_goal type to support 'muscle' and 'skin' goals

-- Drop the existing CHECK constraint
ALTER TABLE food_diaries
DROP CONSTRAINT IF EXISTS food_diaries_eating_goal_check;

-- Add the new CHECK constraint with all 5 goal types
ALTER TABLE food_diaries
ADD CONSTRAINT food_diaries_eating_goal_check
CHECK (eating_goal IN ('digestion', 'satiety', 'energy', 'muscle', 'skin'));

-- Note: This migration is backward compatible.
-- Existing records with 'digestion', 'satiety', or 'energy' will remain valid.
-- New records can now also use 'muscle' or 'skin' goals.
