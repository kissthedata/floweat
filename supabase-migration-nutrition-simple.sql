-- ========================================
-- FLOW:EAT 영양 정보 간소화 마이그레이션
-- 작성일: 2025-11-09
-- 목적: 탄단지만 유지, 칼로리 제거
-- ========================================

-- 1. monthly_stats 뷰 삭제 (total_calories 의존성 때문)
-- ========================================
DROP VIEW IF EXISTS monthly_stats;


-- 2. foods 테이블 수정
-- ========================================

-- 2-1. 영양 효능 설명 컬럼 추가
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS nutrition_benefits TEXT;

COMMENT ON COLUMN foods.nutrition_benefits IS '음식의 주요 영양소 및 건강 효능 설명';

-- 2-2. calories 컬럼 삭제
ALTER TABLE foods
DROP COLUMN IF EXISTS calories;

-- 2-3. nutrition JSONB를 탄단지만 남기기
UPDATE foods
SET nutrition = jsonb_build_object(
  'carbs', COALESCE((nutrition->>'carbs')::numeric, 0),
  'protein', COALESCE((nutrition->>'protein')::numeric, 0),
  'fat', COALESCE((nutrition->>'fat')::numeric, 0)
);


-- 3. food_diaries 테이블 수정
-- ========================================

-- 3-1. total_calories 컬럼 삭제
ALTER TABLE food_diaries
DROP COLUMN IF EXISTS total_calories;

-- 3-2. total_nutrition JSONB를 탄단지만 남기기
UPDATE food_diaries
SET total_nutrition = jsonb_build_object(
  'carbs', COALESCE((total_nutrition->>'carbs')::numeric, 0),
  'protein', COALESCE((total_nutrition->>'protein')::numeric, 0),
  'fat', COALESCE((total_nutrition->>'fat')::numeric, 0)
);


-- 4. eating_order_steps 테이블 수정
-- ========================================

-- 4-1. food_name 컬럼 추가
ALTER TABLE eating_order_steps
ADD COLUMN IF NOT EXISTS food_name TEXT;

-- 4-2. 기존 데이터가 있다면 category_name을 food_name으로 복사
UPDATE eating_order_steps
SET food_name = category_name
WHERE food_name IS NULL;

-- 4-3. category, category_name 컬럼 삭제
ALTER TABLE eating_order_steps
DROP COLUMN IF EXISTS category;

ALTER TABLE eating_order_steps
DROP COLUMN IF EXISTS category_name;


-- 5. monthly_stats 뷰 재생성 (칼로리 제거)
-- ========================================
CREATE OR REPLACE VIEW monthly_stats AS
SELECT
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_meals,
  COUNT(CASE WHEN meal_time = 'breakfast' THEN 1 END) as breakfast_count,
  COUNT(CASE WHEN meal_time = 'lunch' THEN 1 END) as lunch_count,
  COUNT(CASE WHEN meal_time = 'dinner' THEN 1 END) as dinner_count
FROM food_diaries
GROUP BY user_id, DATE_TRUNC('month', created_at);


-- 5. 검증 함수 생성 (선택사항)
-- ========================================
CREATE OR REPLACE FUNCTION validate_nutrition_simple(nutrition JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- 탄단지 3가지만 확인
  RETURN (
    nutrition ? 'carbs' AND
    nutrition ? 'protein' AND
    nutrition ? 'fat'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_nutrition_simple IS 'nutrition JSONB에 탄단지 3가지가 포함되어 있는지 검증';


-- 6. 마이그레이션 완료 확인
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '=== foods 테이블 구조 ===';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'foods'
ORDER BY ordinal_position;

DO $$
BEGIN
  RAISE NOTICE '=== food_diaries 테이블 구조 ===';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'food_diaries'
ORDER BY ordinal_position;


-- 7. 완료 메시지
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ 마이그레이션 완료!';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '  - foods.calories 삭제';
  RAISE NOTICE '  - foods.nutrition_benefits 추가';
  RAISE NOTICE '  - foods.nutrition → 탄단지만 (carbs, protein, fat)';
  RAISE NOTICE '  - food_diaries.total_calories 삭제';
  RAISE NOTICE '  - food_diaries.total_nutrition → 탄단지만';
  RAISE NOTICE '  - monthly_stats 뷰 재생성 (칼로리 제거)';
END $$;
