-- ============================================
-- FLOW:EAT Supabase Database Schema
-- 익명 인증 기반 식단 기록 시스템
-- ============================================

-- 1. food_diaries 테이블 (메인 식단 기록)
CREATE TABLE IF NOT EXISTS food_diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 식사 정보
  meal_time TEXT NOT NULL CHECK (meal_time IN ('breakfast', 'lunch', 'dinner')),
  image_url TEXT,

  -- 칼로리 & 영양 정보
  total_calories INTEGER NOT NULL,
  total_nutrition JSONB NOT NULL, -- {carbs, protein, fat, sugar, sodium}

  -- 먹는 순서 추천
  eating_goal TEXT NOT NULL CHECK (eating_goal IN ('digestion', 'satiety', 'energy')),
  eating_goal_name TEXT NOT NULL,
  eating_reason TEXT NOT NULL,

  -- 사용자 피드백 (선택)
  user_feedback JSONB, -- {digestion, satiety, energy} - 각각 'good'|'normal'|'bad'

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. foods 테이블 (개별 음식 아이템)
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES food_diaries(id) ON DELETE CASCADE,

  -- 음식 정보
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('vegetable', 'protein', 'fat', 'carbohydrate', 'sugar')),
  calories INTEGER NOT NULL,
  nutrition JSONB NOT NULL, -- {carbs, protein, fat, sugar, sodium}

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. eating_order_steps 테이블 (먹는 순서 단계)
CREATE TABLE IF NOT EXISTS eating_order_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES food_diaries(id) ON DELETE CASCADE,

  -- 순서 정보
  order_number INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('vegetable', 'protein', 'fat', 'carbohydrate', 'sugar')),
  category_name TEXT NOT NULL,
  description TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 인덱스 (성능 최적화)
-- ============================================

-- food_diaries 인덱스
CREATE INDEX IF NOT EXISTS idx_food_diaries_user_id ON food_diaries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_diaries_created_at ON food_diaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_diaries_user_date ON food_diaries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_diaries_meal_time ON food_diaries(meal_time);

-- foods 인덱스
CREATE INDEX IF NOT EXISTS idx_foods_diary_id ON foods(diary_id);

-- eating_order_steps 인덱스
CREATE INDEX IF NOT EXISTS idx_eating_order_steps_diary_id ON eating_order_steps(diary_id);
CREATE INDEX IF NOT EXISTS idx_eating_order_steps_order ON eating_order_steps(diary_id, order_number);

-- ============================================
-- Row Level Security (RLS) 정책
-- 익명 사용자도 자기 데이터만 접근 가능
-- ============================================

-- RLS 활성화
ALTER TABLE food_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE eating_order_steps ENABLE ROW LEVEL SECURITY;

-- food_diaries 정책
CREATE POLICY "Users can view their own diaries"
  ON food_diaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diaries"
  ON food_diaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diaries"
  ON food_diaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diaries"
  ON food_diaries FOR DELETE
  USING (auth.uid() = user_id);

-- foods 정책 (diary의 소유자만 접근)
CREATE POLICY "Users can view foods from their diaries"
  ON foods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM food_diaries
      WHERE food_diaries.id = foods.diary_id
      AND food_diaries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert foods to their diaries"
  ON foods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_diaries
      WHERE food_diaries.id = foods.diary_id
      AND food_diaries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete foods from their diaries"
  ON foods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM food_diaries
      WHERE food_diaries.id = foods.diary_id
      AND food_diaries.user_id = auth.uid()
    )
  );

-- eating_order_steps 정책
CREATE POLICY "Users can view steps from their diaries"
  ON eating_order_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM food_diaries
      WHERE food_diaries.id = eating_order_steps.diary_id
      AND food_diaries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert steps to their diaries"
  ON eating_order_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_diaries
      WHERE food_diaries.id = eating_order_steps.diary_id
      AND food_diaries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete steps from their diaries"
  ON eating_order_steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM food_diaries
      WHERE food_diaries.id = eating_order_steps.diary_id
      AND food_diaries.user_id = auth.uid()
    )
  );

-- ============================================
-- 트리거 (updated_at 자동 업데이트)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_food_diaries_updated_at
  BEFORE UPDATE ON food_diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 유용한 뷰 (선택사항)
-- ============================================

-- 월별 통계 뷰
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

-- ============================================
-- 설치 완료 확인용 코멘트
-- ============================================
COMMENT ON TABLE food_diaries IS 'FLOW:EAT 식단 기록 메인 테이블 (익명 인증 지원)';
COMMENT ON TABLE foods IS '개별 음식 아이템 (food_diaries의 자식)';
COMMENT ON TABLE eating_order_steps IS 'AI 추천 먹는 순서 (food_diaries의 자식)';
