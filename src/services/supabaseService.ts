import { supabase } from '../lib/supabase';
import type { FoodDiary, MealTime } from '../types';
import { formatDateKey, isSameDay } from '../utils/dateUtils';

/**
 * Supabase DB 타입 정의
 */
interface DbFoodDiary {
  id: string;
  user_id: string;
  meal_time: string;
  image_url: string | null;
  total_nutrition: {
    carbs: number;
    protein: number;
    fat: number;
  };
  eating_goal: string;
  eating_goal_name: string;
  eating_reason: string;
  user_feedback: {
    digestion: 'good' | 'normal' | 'bad';
    satiety: 'good' | 'normal' | 'bad';
    energy: 'good' | 'normal' | 'bad';
  } | null;
  created_at: string;
}

interface DbFood {
  id: string;
  diary_id: string;
  name: string;
  category: string;
  nutrition_benefits: string;
  nutrition: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

interface DbEatingOrderStep {
  id: string;
  diary_id: string;
  order_number: number;
  food_name: string;
  description: string;
}

/**
 * 모든 식단 기록 가져오기
 */
export async function getAllDiaries(): Promise<FoodDiary[]> {
  try {
    const { data: diaries, error: diariesError } = await supabase
      .from('food_diaries')
      .select('*')
      .order('created_at', { ascending: false });

    if (diariesError) throw diariesError;
    if (!diaries || diaries.length === 0) return [];

    // foods와 eating_order_steps 가져오기
    const diaryIds = diaries.map((d) => d.id);

    const { data: foods, error: foodsError } = await supabase
      .from('foods')
      .select('*')
      .in('diary_id', diaryIds);

    const { data: steps, error: stepsError } = await supabase
      .from('eating_order_steps')
      .select('*')
      .in('diary_id', diaryIds)
      .order('order_number', { ascending: true });

    if (foodsError) throw foodsError;
    if (stepsError) throw stepsError;

    // DB 데이터를 TypeScript 타입으로 변환
    return diaries.map((diary) => convertDbToFoodDiary(diary, foods || [], steps || []));
  } catch (error) {
    console.error('Failed to load diaries:', error);
    return [];
  }
}

/**
 * 식단 기록 저장
 */
export async function saveDiary(diary: Omit<FoodDiary, 'id'>): Promise<FoodDiary | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. food_diaries 삽입
    const { data: savedDiary, error: diaryError } = await supabase
      .from('food_diaries')
      .insert({
        user_id: user.id,
        meal_time: diary.mealTime,
        image_url: diary.imageUrl,
        total_nutrition: diary.totalNutrition,
        eating_goal: diary.eatingOrder.goal,
        eating_goal_name: diary.eatingOrder.goalName,
        eating_reason: diary.eatingOrder.reason,
        user_feedback: diary.userFeedback || null,
        created_at: new Date(diary.timestamp).toISOString(),
      })
      .select()
      .single();

    if (diaryError) throw diaryError;

    // 2. foods 삽입
    const foodsToInsert = diary.foods.map((food) => ({
      diary_id: savedDiary.id,
      name: food.name,
      category: food.category,
      nutrition_benefits: food.nutritionBenefits,
      nutrition: food.nutrition,
    }));

    const { data: savedFoods, error: foodsError } = await supabase
      .from('foods')
      .insert(foodsToInsert)
      .select();

    if (foodsError) throw foodsError;

    // 3. eating_order_steps 삽입
    const stepsToInsert = diary.eatingOrder.steps.map((step) => ({
      diary_id: savedDiary.id,
      order_number: step.order,
      food_name: step.foodName,
      description: step.description,
    }));

    const { data: savedSteps, error: stepsError } = await supabase
      .from('eating_order_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) throw stepsError;

    return convertDbToFoodDiary(savedDiary, savedFoods, savedSteps);
  } catch (error) {
    console.error('Failed to save diary:', error);
    return null;
  }
}

/**
 * 특정 날짜의 식단 기록 가져오기
 */
export async function getDiariesByDate(date: Date): Promise<FoodDiary[]> {
  const allDiaries = await getAllDiaries();
  return allDiaries.filter((diary) => {
    const diaryDate = new Date(diary.timestamp);
    return isSameDay(diaryDate, date);
  });
}

/**
 * 특정 날짜와 식사 시간의 기록 가져오기
 */
export async function getDiaryByDateAndMealTime(
  date: Date,
  mealTime: MealTime
): Promise<FoodDiary | null> {
  const diaries = await getDiariesByDate(date);
  return diaries.find((diary) => diary.mealTime === mealTime) || null;
}

/**
 * 특정 월의 식단 기록 가져오기
 */
export async function getDiariesByMonth(year: number, month: number): Promise<FoodDiary[]> {
  try {
    // 월의 시작과 끝 계산
    const startOfMonth = new Date(year, month, 1).toISOString();
    const startOfNextMonth = new Date(year, month + 1, 1).toISOString();

    // 월별로 직접 필터링된 쿼리
    const { data: diaries, error: diariesError } = await supabase
      .from('food_diaries')
      .select('*')
      .gte('created_at', startOfMonth)
      .lt('created_at', startOfNextMonth)
      .order('created_at', { ascending: false });

    if (diariesError) throw diariesError;
    if (!diaries || diaries.length === 0) return [];

    // foods와 eating_order_steps 가져오기
    const diaryIds = diaries.map((d) => d.id);

    const { data: foods, error: foodsError } = await supabase
      .from('foods')
      .select('*')
      .in('diary_id', diaryIds);

    const { data: steps, error: stepsError } = await supabase
      .from('eating_order_steps')
      .select('*')
      .in('diary_id', diaryIds)
      .order('order_number', { ascending: true });

    if (foodsError) throw foodsError;
    if (stepsError) throw stepsError;

    // DB 데이터를 TypeScript 타입으로 변환
    return diaries.map((diary) => convertDbToFoodDiary(diary, foods || [], steps || []));
  } catch (error) {
    console.error('Failed to load diaries by month:', error);
    return [];
  }
}

/**
 * 식단 기록 업데이트
 */
export async function updateDiary(
  id: string,
  updates: Partial<FoodDiary>
): Promise<void> {
  try {
    const dbUpdates: any = {};

    if (updates.mealTime) dbUpdates.meal_time = updates.mealTime;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.userFeedback) dbUpdates.user_feedback = updates.userFeedback;

    const { error } = await supabase
      .from('food_diaries')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to update diary:', error);
  }
}

/**
 * 식단 기록 삭제
 */
export async function deleteDiary(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('food_diaries').delete().eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete diary:', error);
  }
}

/**
 * 날짜별로 식사 시간을 그룹화
 */
export function getMealTimesByDate(diaries: FoodDiary[]): Map<string, MealTime[]> {
  const map = new Map<string, MealTime[]>();

  diaries.forEach((diary) => {
    const dateKey = formatDateKey(new Date(diary.timestamp));
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)!.push(diary.mealTime);
  });

  return map;
}

/**
 * 최근 기록 가져오기
 */
export async function getRecentDiaries(limit: number = 5): Promise<FoodDiary[]> {
  const diaries = await getAllDiaries();
  return diaries.slice(0, limit);
}

/**
 * 월별 통계 계산
 */
export async function getMonthlyStats(year: number, month: number) {
  const diaries = await getDiariesByMonth(year, month);

  const mealCounts = {
    breakfast: diaries.filter((d) => d.mealTime === 'breakfast').length,
    lunch: diaries.filter((d) => d.mealTime === 'lunch').length,
    dinner: diaries.filter((d) => d.mealTime === 'dinner').length,
  };

  return {
    totalMeals: diaries.length,
    mealCounts,
  };
}

/**
 * DB 데이터를 TypeScript FoodDiary 타입으로 변환
 */
function convertDbToFoodDiary(
  dbDiary: DbFoodDiary,
  allFoods: DbFood[],
  allSteps: DbEatingOrderStep[]
): FoodDiary {
  const foods = allFoods.filter((f) => f.diary_id === dbDiary.id);
  const steps = allSteps.filter((s) => s.diary_id === dbDiary.id);

  return {
    id: dbDiary.id,
    mealTime: dbDiary.meal_time as MealTime,
    imageUrl: dbDiary.image_url || '',
    foods: foods.map((f) => ({
      name: f.name,
      category: f.category as any,
      nutritionBenefits: f.nutrition_benefits,
      nutrition: f.nutrition,
    })),
    totalNutrition: dbDiary.total_nutrition,
    eatingOrder: {
      goal: dbDiary.eating_goal as any,
      goalName: dbDiary.eating_goal_name,
      steps: steps.map((s) => ({
        order: s.order_number,
        foodName: s.food_name,
        description: s.description,
      })),
      reason: dbDiary.eating_reason,
    },
    timestamp: new Date(dbDiary.created_at).getTime(),
    userFeedback: dbDiary.user_feedback || undefined,
  };
}

/**
 * 캘린더 캐시 조회
 */
export async function getCachedCalendarData(
  year: number,
  month: number
): Promise<FoodDiary[] | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const cacheKey = `${year}-${month}`;

    const { data, error } = await supabase
      .from('calendar_cache')
      .select('data, expires_at')
      .eq('user_id', user.id)
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) return null;

    // 캐시 만료 확인
    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt) {
      // 만료된 캐시 삭제
      await supabase
        .from('calendar_cache')
        .delete()
        .eq('user_id', user.id)
        .eq('cache_key', cacheKey);
      return null;
    }

    // 캐시된 데이터 반환
    return data.data as FoodDiary[];
  } catch (error) {
    console.error('Failed to get cached calendar data:', error);
    return null;
  }
}

/**
 * 캘린더 캐시 저장
 */
export async function setCachedCalendarData(
  year: number,
  month: number,
  diaries: FoodDiary[]
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const cacheKey = `${year}-${month}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30분 TTL

    // Upsert: 존재하면 업데이트, 없으면 생성
    const { error } = await supabase
      .from('calendar_cache')
      .upsert(
        {
          user_id: user.id,
          cache_key: cacheKey,
          data: diaries,
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: 'user_id,cache_key',
        }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Failed to set cached calendar data:', error);
  }
}

/**
 * 특정 월의 캐시 무효화
 */
export async function invalidateCalendarCache(year: number, month: number): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const cacheKey = `${year}-${month}`;

    const { error } = await supabase
      .from('calendar_cache')
      .delete()
      .eq('user_id', user.id)
      .eq('cache_key', cacheKey);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to invalidate calendar cache:', error);
  }
}

/**
 * 모든 캘린더 캐시 무효화
 */
export async function invalidateAllCalendarCache(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('calendar_cache')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to invalidate all calendar cache:', error);
  }
}
