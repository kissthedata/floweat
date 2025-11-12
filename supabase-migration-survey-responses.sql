-- =============================================
-- Survey Responses Table Migration
-- Created: 2025-11-12
-- Purpose: Store FLOW:EAT user survey responses
-- =============================================

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Q0: 먹는 순서 건강 영향 인지도 (1-5)
  q0 INTEGER CHECK (q0 >= 1 AND q0 <= 5),

  -- Q1: 순서 추천 도움 정도 (1-5)
  q1 INTEGER CHECK (q1 >= 1 AND q1 <= 5),

  -- Q2: 음식 구성 인식 정확도 (1-5)
  q2 INTEGER CHECK (q2 >= 1 AND q2 <= 5),

  -- Q3: 사진→결과 과정 편의성 (1-5)
  q3 INTEGER CHECK (q3 >= 1 AND q3 <= 5),

  -- Q4: 재사용 의향 (1-5)
  q4 INTEGER CHECK (q4 >= 1 AND q4 <= 5),

  -- Q5: 설명 이해도 (1-5)
  q5 INTEGER CHECK (q5 >= 1 AND q5 <= 5),

  -- Q6: 실제 따라먹기 시도 (0-4)
  q6 INTEGER CHECK (q6 >= 0 AND q6 <= 4),

  -- Q7: NPS 추천 의향 (0-10)
  q7 INTEGER CHECK (q7 >= 0 AND q7 <= 10),

  -- Q8: 사진 인식 속도 만족도 (1-5)
  q8 INTEGER CHECK (q8 >= 1 AND q8 <= 5),

  -- Q9: 불편했던 점 (다중 선택)
  q9 TEXT[],
  q9_other TEXT,

  -- Q10: 재사용 상황 (단일 선택)
  q10 TEXT,
  q10_other TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at
  ON survey_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id
  ON survey_responses(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can insert (anonymous survey allowed)
CREATE POLICY "Anyone can submit survey responses"
  ON survey_responses
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Users can view their own responses
CREATE POLICY "Users can view their own survey responses"
  ON survey_responses
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policy: Service role can view all (for admin analytics)
CREATE POLICY "Service role can view all survey responses"
  ON survey_responses
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Create a view for survey statistics (admin analytics)
CREATE OR REPLACE VIEW survey_stats AS
SELECT
  COUNT(*) as total_responses,
  AVG(q0) as avg_awareness,
  AVG(q1) as avg_helpfulness,
  AVG(q2) as avg_accuracy,
  AVG(q3) as avg_convenience,
  AVG(q4) as avg_reuse_intention,
  AVG(q5) as avg_explanation_clarity,
  AVG(q6) as avg_actual_usage,
  AVG(q7) as avg_nps,
  AVG(q8) as avg_speed_satisfaction,
  -- NPS calculation: % Promoters (9-10) - % Detractors (0-6)
  (COUNT(CASE WHEN q7 >= 9 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) -
  (COUNT(CASE WHEN q7 <= 6 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as nps_score,
  DATE_TRUNC('day', created_at) as response_date
FROM survey_responses
GROUP BY DATE_TRUNC('day', created_at);

-- Grant access to the view
GRANT SELECT ON survey_stats TO authenticated, anon;

-- Add comment to table
COMMENT ON TABLE survey_responses IS 'Stores user survey responses for FLOW:EAT user experience feedback';

-- Add comments to columns
COMMENT ON COLUMN survey_responses.q0 IS '먹는 순서 건강 영향 인지도 (1: 전혀 몰랐다 ~ 5: 매우 잘 알고 있었다)';
COMMENT ON COLUMN survey_responses.q1 IS '순서 추천 도움 정도 (1: 전혀 도움 안 됨 ~ 5: 매우 도움됨)';
COMMENT ON COLUMN survey_responses.q2 IS '음식 구성 인식 정확도 (1: 매우 부정확 ~ 5: 매우 정확함)';
COMMENT ON COLUMN survey_responses.q3 IS '사진→결과 과정 편의성 (1: 매우 불편 ~ 5: 매우 편함)';
COMMENT ON COLUMN survey_responses.q4 IS '재사용 의향 (1: 없음 ~ 5: 매우 있음)';
COMMENT ON COLUMN survey_responses.q5 IS '설명 이해도 (1: 매우 어려움 ~ 5: 매우 쉬움)';
COMMENT ON COLUMN survey_responses.q6 IS '실제 따라먹기 시도 (0: 테스트만 ~ 4: 완전히 그 순서대로)';
COMMENT ON COLUMN survey_responses.q7 IS 'NPS 추천 의향 (0: 전혀 추천 안함 ~ 10: 적극 추천)';
COMMENT ON COLUMN survey_responses.q8 IS '사진 인식 속도 만족도 (1: 매우 느림 ~ 5: 매우 빠름)';
COMMENT ON COLUMN survey_responses.q9 IS '불편했던 점 (배열: 사진 인식 정확도, 결과 로딩 시간, 등)';
COMMENT ON COLUMN survey_responses.q10 IS '재사용 상황 (출근/직장 점심, 학교·공부 중 식사, 등)';
