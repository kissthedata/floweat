// 음식 카테고리
export type FoodCategory =
  | 'vegetable'      // 야채/섬유질
  | 'protein'        // 단백질
  | 'fat'            // 지방
  | 'carbohydrate'   // 탄수화물
  | 'sugar';         // 단순당

// 먹는 목표
export type EatingGoal =
  | 'digestion'      // 소화 편안함
  | 'satiety'        // 포만감 오래 유지
  | 'energy'         // 졸림/피로 방지
  | 'muscle'         // 근육 생성
  | 'skin'           // 피부 건강
  | 'weight';        // 체중 관리

// 식사 시간
export type MealTime =
  | 'breakfast'      // 아침
  | 'lunch'          // 점심
  | 'dinner';        // 저녁

// 음식 아이템
export interface FoodItem {
  name: string;
  category: FoodCategory;
  nutritionBenefits?: string;  // 영양소 및 건강 효능 설명 (2차 분석 후 추가)
  nutrition?: {                // 영양 성분 (2차 분석 후 추가)
    carbs: number;         // 탄수화물 (g)
    protein: number;       // 단백질 (g)
    fat: number;           // 지방 (g)
  };
  warnings?: {                 // 주의사항 (2차 분석 후 추가)
    timing?: string;           // 섭취 시간대 주의
    overconsumption?: string;  // 과다섭취 주의
    general?: string;          // 일반 주의사항
  };
}

// 먹는 순서 단계
export interface EatingStep {
  order: number;
  foodName: string;      // 실제 음식 이름 (예: "브로콜리")
  description: string;   // 설명
}

// 먹는 순서 추천
export interface EatingOrderGuide {
  goal: EatingGoal;
  goalName: string;
  steps: EatingStep[];
  reason: string;
}

// 식단 분석 결과
export interface MealAnalysis {
  imageUrl: string;
  foods: FoodItem[];
  totalNutrition: {
    carbs: number;     // 탄수화물
    protein: number;   // 단백질
    fat: number;       // 지방
  };
  eatingOrder: EatingOrderGuide;
  nutritionAnalysis?: string;  // AI 영양 분석 코멘트
  timestamp: number;
}

// 식단 기록 일지
export interface FoodDiary extends MealAnalysis {
  id: string;
  mealTime: MealTime;  // 아침/점심/저녁
  userFeedback?: {
    digestion: 'good' | 'normal' | 'bad';    // 소화 상태
    satiety: 'good' | 'normal' | 'bad';      // 포만감
    energy: 'good' | 'normal' | 'bad';       // 졸림/피로
  };
}

// 캘린더 날짜 정보
export interface CalendarDate {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  meals: MealTime[];  // 해당 날짜의 식사 기록들
}

// 월별 캘린더 데이터
export interface MonthData {
  year: number;
  month: number;
  dates: CalendarDate[];
}

// 사용자 설정
export interface UserPreferences {
  id: string;
  userId: string;
  hasCompletedTutorial: boolean;
  tutorialCompletedAt?: number;  // timestamp
  createdAt: number;             // timestamp
  updatedAt: number;             // timestamp
}
