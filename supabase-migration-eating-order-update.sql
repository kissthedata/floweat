-- ========================================
-- FLOW:EAT eating_order_steps 테이블 구조 변경
-- 작성일: 2025-11-10
-- 목적: category 기반 → 실제 음식 이름 기반으로 변경
-- ========================================

-- 1. eating_order_steps 테이블 수정
-- ========================================

-- 1-1. food_name 컬럼 추가
ALTER TABLE eating_order_steps
ADD COLUMN IF NOT EXISTS food_name TEXT;

COMMENT ON COLUMN eating_order_steps.food_name IS '실제 음식 이름 (예: "브로콜리", "계란후라이")';

-- 1-2. 기존 데이터가 있다면 category_name을 food_name으로 복사
UPDATE eating_order_steps
SET food_name = category_name
WHERE food_name IS NULL;

-- 1-3. food_name NOT NULL 제약조건 추가
ALTER TABLE eating_order_steps
ALTER COLUMN food_name SET NOT NULL;

-- 1-4. category, category_name 컬럼 삭제
ALTER TABLE eating_order_steps
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS category_name;


-- 2. 마이그레이션 완료 확인
-- ========================================

-- eating_order_steps 테이블 구조 확인
DO $$
BEGIN
  RAISE NOTICE '=== eating_order_steps 테이블 구조 ===';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'eating_order_steps'
ORDER BY ordinal_position;


-- 3. 완료 메시지
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ 마이그레이션 완료!';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '  - eating_order_steps.food_name 컬럼 추가';
  RAISE NOTICE '  - eating_order_steps.category 컬럼 삭제';
  RAISE NOTICE '  - eating_order_steps.category_name 컬럼 삭제';
END $$;
