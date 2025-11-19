-- Migration: Remove 'muscle' and 'skin' eating goals
-- Date: 2025-11-19
-- Description: Removes 'muscle' and 'skin' from eating_goal constraint due to weak scientific evidence
--              Keeps 'digestion', 'satiety', 'energy', and 'weight' goals only

-- Drop the existing CHECK constraint
ALTER TABLE food_diaries
DROP CONSTRAINT IF EXISTS food_diaries_eating_goal_check;

-- Add the updated CHECK constraint with 4 goal types only
ALTER TABLE food_diaries
ADD CONSTRAINT food_diaries_eating_goal_check
CHECK (eating_goal IN ('digestion', 'satiety', 'energy', 'weight'));

-- Note: If there are existing records with 'muscle' or 'skin' goals,
-- you may need to update them first before running this migration:
-- UPDATE food_diaries SET eating_goal = 'energy' WHERE eating_goal = 'muscle';
-- UPDATE food_diaries SET eating_goal = 'digestion' WHERE eating_goal = 'skin';
