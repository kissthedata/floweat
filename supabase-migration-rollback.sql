-- ========================================
-- FLOW:EAT 영양 정보 개편 마이그레이션 롤백
-- 작성일: 2025-11-09
-- 목적: 마이그레이션을 이전 상태로 되돌리기 (긴급 복구용)
-- ========================================

-- 경고: 이 스크립트는 마이그레이션을 완전히 되돌립니다.
-- 새로 추가된 데이터(nutrition_benefits, fiber, cholesterol)가 손실될 수 있습니다.

-- 1. foods 테이블 원복
-- ========================================

-- 1-1. calories 컬럼 복원
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT 0;

-- 1-2. nutrition에서 fiber, cholesterol 제거
UPDATE foods
SET nutrition = nutrition - 'fiber' - 'cholesterol';

-- 1-3. nutrition_benefits 컬럼 삭제
ALTER TABLE foods
DROP COLUMN IF EXISTS nutrition_benefits;


-- 2. food_diaries 테이블 원복
-- ========================================

-- 2-1. monthly_stats 뷰 삭제 (재생성을 위해)
DROP VIEW IF EXISTS monthly_stats;

-- 2-2. total_calories 컬럼 복원
ALTER TABLE food_diaries
ADD COLUMN IF NOT EXISTS total_calories INTEGER DEFAULT 0;

-- 2-3. total_nutrition에서 fiber, cholesterol 제거
UPDATE food_diaries
SET total_nutrition = total_nutrition - 'fiber' - 'cholesterol';

-- 2-4. monthly_stats 뷰 원래대로 재생성
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


-- 3. 검증 함수 삭제 (존재할 경우)
-- ========================================

DROP FUNCTION IF EXISTS validate_nutrition_structure(JSONB);


-- 4. 제약조건 삭제 (추가했을 경우)
-- ========================================

ALTER TABLE foods
DROP CONSTRAINT IF EXISTS foods_nutrition_check;

ALTER TABLE food_diaries
DROP CONSTRAINT IF EXISTS food_diaries_nutrition_check;


-- 5. 롤백 완료 확인
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '=== foods 테이블 구조 ===';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'foods'
ORDER BY ordinal_position;

DO $$
BEGIN
  RAISE NOTICE '=== food_diaries 테이블 구조 ===';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'food_diaries'
ORDER BY ordinal_position;


-- 6. 완료 메시지
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ 롤백 완료!';
  RAISE NOTICE '복원된 사항:';
  RAISE NOTICE '  - foods.calories 컬럼 복원';
  RAISE NOTICE '  - foods.nutrition_benefits 컬럼 삭제';
  RAISE NOTICE '  - foods.nutrition에서 fiber, cholesterol 제거';
  RAISE NOTICE '  - food_diaries.total_calories 컬럼 복원';
  RAISE NOTICE '  - food_diaries.total_nutrition에서 fiber, cholesterol 제거';
  RAISE WARNING '⚠️ 주의: 새로 추가된 nutrition_benefits, fiber, cholesterol 데이터가 손실되었습니다.';
END $$;
