-- ========================================
-- FLOW:EAT 영양 정보 개편 마이그레이션
-- 작성일: 2025-11-09
-- 목적: 칼로리 제거, 영양 성분 확장 (fiber, cholesterol 추가), 영양 효능 설명 추가
-- ========================================

-- 1. foods 테이블 수정
-- ========================================

-- 1-1. 영양 효능 설명 컬럼 추가
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS nutrition_benefits TEXT;

COMMENT ON COLUMN foods.nutrition_benefits IS '음식의 주요 영양소 및 건강 효능 설명 (예: "비타민C, 식이섬유 풍부 → 소화 촉진, 항산화 효과")';

-- 1-2. 기존 nutrition JSONB에 fiber, cholesterol 추가
-- 기존 데이터가 있다면 0으로 초기화
UPDATE foods
SET nutrition = jsonb_set(
  jsonb_set(
    nutrition,
    '{fiber}',
    '0'::jsonb
  ),
  '{cholesterol}',
  '0'::jsonb
)
WHERE NOT (nutrition ? 'fiber' AND nutrition ? 'cholesterol');

-- 1-3. calories 컬럼 삭제 (더 이상 사용하지 않음)
ALTER TABLE foods
DROP COLUMN IF EXISTS calories;


-- 2. food_diaries 테이블 수정
-- ========================================

-- 2-1. 먼저 monthly_stats 뷰 삭제 (total_calories 컬럼을 사용하고 있음)
DROP VIEW IF EXISTS monthly_stats;

-- 2-2. total_nutrition JSONB에 fiber, cholesterol 추가
-- 기존 데이터가 있다면 0으로 초기화
UPDATE food_diaries
SET total_nutrition = jsonb_set(
  jsonb_set(
    total_nutrition,
    '{fiber}',
    '0'::jsonb
  ),
  '{cholesterol}',
  '0'::jsonb
)
WHERE NOT (total_nutrition ? 'fiber' AND total_nutrition ? 'cholesterol');

-- 2-3. total_calories 컬럼 삭제
ALTER TABLE food_diaries
DROP COLUMN IF EXISTS total_calories;

-- 2-4. monthly_stats 뷰 재생성 (total_calories 제거)
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


-- 3. 데이터 검증 함수 생성 (선택사항)
-- ========================================

-- nutrition JSONB 구조 검증 함수
CREATE OR REPLACE FUNCTION validate_nutrition_structure(nutrition JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- 7가지 영양 성분이 모두 존재하는지 확인
  RETURN (
    nutrition ? 'carbs' AND
    nutrition ? 'protein' AND
    nutrition ? 'fat' AND
    nutrition ? 'sugar' AND
    nutrition ? 'sodium' AND
    nutrition ? 'fiber' AND
    nutrition ? 'cholesterol'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_nutrition_structure IS 'nutrition JSONB에 필수 7가지 영양 성분이 모두 포함되어 있는지 검증';


-- 4. 제약조건 추가 (엄격한 검증 원할 경우 주석 해제)
-- ========================================

-- foods 테이블에 nutrition 구조 검증 제약조건
-- ALTER TABLE foods
-- ADD CONSTRAINT foods_nutrition_check
-- CHECK (validate_nutrition_structure(nutrition));

-- food_diaries 테이블에 total_nutrition 구조 검증 제약조건
-- ALTER TABLE food_diaries
-- ADD CONSTRAINT food_diaries_nutrition_check
-- CHECK (validate_nutrition_structure(total_nutrition));


-- 5. 마이그레이션 완료 확인 쿼리
-- ========================================

-- foods 테이블 구조 확인
DO $$
BEGIN
  RAISE NOTICE '=== foods 테이블 구조 ===';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'foods'
ORDER BY ordinal_position;

-- food_diaries 테이블 구조 확인
DO $$
BEGIN
  RAISE NOTICE '=== food_diaries 테이블 구조 ===';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'food_diaries'
ORDER BY ordinal_position;

-- 샘플 데이터 확인 (있을 경우)
DO $$
BEGIN
  RAISE NOTICE '=== 샘플 데이터 확인 ===';
END $$;

SELECT
  COUNT(*) as total_diaries,
  COUNT(CASE WHEN (total_nutrition ? 'fiber' AND total_nutrition ? 'cholesterol') THEN 1 END) as migrated_count
FROM food_diaries;

SELECT
  COUNT(*) as total_foods,
  COUNT(CASE WHEN (nutrition ? 'fiber' AND nutrition ? 'cholesterol') THEN 1 END) as migrated_count,
  COUNT(CASE WHEN nutrition_benefits IS NOT NULL THEN 1 END) as has_benefits_count
FROM foods;


-- 6. 완료 메시지
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ 마이그레이션 완료!';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '  - foods.calories 컬럼 삭제';
  RAISE NOTICE '  - foods.nutrition_benefits 컬럼 추가';
  RAISE NOTICE '  - foods.nutrition에 fiber, cholesterol 추가';
  RAISE NOTICE '  - food_diaries.total_calories 컬럼 삭제';
  RAISE NOTICE '  - food_diaries.total_nutrition에 fiber, cholesterol 추가';
END $$;
