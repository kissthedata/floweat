-- ========================================
-- FLOW:EAT 영양 정보 간소화 마이그레이션 롤백
-- 작성일: 2025-11-09
-- 목적: 이전 상태로 복구 (긴급 시)
-- ========================================

-- 경고: 이 스크립트는 마이그레이션을 완전히 되돌립니다.
-- nutrition_benefits 데이터와 간소화된 nutrition 데이터가 손실될 수 있습니다.

-- 1. monthly_stats 뷰 삭제
-- ========================================
DROP VIEW IF EXISTS monthly_stats;


-- 2. foods 테이블 원복
-- ========================================

-- 2-1. calories 컬럼 복원
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT 0;

-- 2-2. nutrition_benefits 컬럼 삭제
ALTER TABLE foods
DROP COLUMN IF EXISTS nutrition_benefits;

-- 2-3. nutrition JSONB 확장 (sugar, sodium 추가)
UPDATE foods
SET nutrition = jsonb_build_object(
  'carbs', COALESCE((nutrition->>'carbs')::numeric, 0),
  'protein', COALESCE((nutrition->>'protein')::numeric, 0),
  'fat', COALESCE((nutrition->>'fat')::numeric, 0),
  'sugar', 0,
  'sodium', 0
);


-- 3. food_diaries 테이블 원복
-- ========================================

-- 3-1. total_calories 컬럼 복원
ALTER TABLE food_diaries
ADD COLUMN IF NOT EXISTS total_calories INTEGER DEFAULT 0;

-- 3-2. total_nutrition JSONB 확장
UPDATE food_diaries
SET total_nutrition = jsonb_build_object(
  'carbs', COALESCE((total_nutrition->>'carbs')::numeric, 0),
  'protein', COALESCE((total_nutrition->>'protein')::numeric, 0),
  'fat', COALESCE((total_nutrition->>'fat')::numeric, 0),
  'sugar', 0,
  'sodium', 0
);


-- 4. monthly_stats 뷰 원래대로 재생성
-- ========================================
CREATE OR REPLACE VIEW monthly_stats AS
SELECT
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_meals,
  SUM(total_calories) as total_calories,
  ROUND(AVG(total_calories)) as avg_calories,
  COUNT(CASE WHEN meal_time = 'breakfast' THEN 1 END) as breakfast_count,
  COUNT(CASE WHEN meal_time = 'lunch' THEN 1 END) as lunch_count,
  COUNT(CASE WHEN meal_time = 'dinner' THEN 1 END) as dinner_count
FROM food_diaries
GROUP BY user_id, DATE_TRUNC('month', created_at);


-- 5. 검증 함수 삭제
-- ========================================
DROP FUNCTION IF EXISTS validate_nutrition_simple(JSONB);


-- 6. 완료 메시지
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ 롤백 완료!';
  RAISE NOTICE '복원된 사항:';
  RAISE NOTICE '  - foods.calories 복원';
  RAISE NOTICE '  - foods.nutrition_benefits 삭제';
  RAISE NOTICE '  - foods.nutrition에 sugar, sodium 추가';
  RAISE NOTICE '  - food_diaries.total_calories 복원';
  RAISE NOTICE '  - food_diaries.total_nutrition에 sugar, sodium 추가';
  RAISE NOTICE '  - monthly_stats 뷰 원래대로 복원';
  RAISE WARNING '⚠️ 주의: nutrition_benefits 데이터가 손실되었습니다.';
END $$;
