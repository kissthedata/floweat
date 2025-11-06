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
  | 'energy';        // 졸림/피로 방지

// 식사 시간
export type MealTime =
  | 'breakfast'      // 아침
  | 'lunch'          // 점심
  | 'dinner';        // 저녁

// 음식 아이템
export interface FoodItem {
  name: string;
  category: FoodCategory;
  calories: number;
  nutrition: {
    carbs: number;      // 탄수화물 (g)
    protein: number;    // 단백질 (g)
    fat: number;        // 지방 (g)
    sugar: number;      // 당 (g)
    sodium: number;     // 나트륨 (mg)
  };
}

// 먹는 순서 단계
export interface EatingStep {
  order: number;
  category: FoodCategory;
  categoryName: string;
  description: string;
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
  totalCalories: number;
  totalNutrition: {
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
    sodium: number;
  };
  eatingOrder: EatingOrderGuide;
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
