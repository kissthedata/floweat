import type { FoodDiary, MealTime } from '../types';
import { saveDiary } from '../services/supabaseService';

/**
 * 샘플 식단 데이터 생성
 */
export async function generateSampleDiaries() {
  const now = new Date();
  const samples: Omit<FoodDiary, 'id' | 'timestamp'>[] = [];

  // 지난 14일간의 데이터 생성
  for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    // 랜덤하게 1-3개의 식사 생성
    const numMeals = Math.floor(Math.random() * 3) + 1;
    const mealTimes: MealTime[] = ['breakfast', 'lunch', 'dinner'];
    const selectedMeals = mealTimes.slice(0, numMeals);

    for (const mealTime of selectedMeals) {
      const mealData = getSampleMealData(mealTime);
      const timestamp = new Date(date);

      // 식사 시간에 맞춰 시간 설정
      if (mealTime === 'breakfast') {
        timestamp.setHours(8, 0, 0, 0);
      } else if (mealTime === 'lunch') {
        timestamp.setHours(12, 30, 0, 0);
      } else {
        timestamp.setHours(19, 0, 0, 0);
      }

      const diary: Omit<FoodDiary, 'id'> = {
        mealTime,
        timestamp: timestamp.getTime(),
        ...mealData,
      };

      await saveDiary(diary);
    }
  }
}

/**
 * 식사별 샘플 데이터
 */
function getSampleMealData(mealTime: MealTime) {
  const breakfastMeals = [
    {
      imageUrl: '',
      foods: [
        {
          name: '토스트',
          category: 'carbohydrate' as const,
          calories: 200,
          nutrition: { carbs: 38, protein: 6, fat: 3, sugar: 4, sodium: 300 },
        },
        {
          name: '계란',
          category: 'protein' as const,
          calories: 80,
          nutrition: { carbs: 1, protein: 7, fat: 5, sugar: 0, sodium: 70 },
        },
        {
          name: '샐러드',
          category: 'vegetable' as const,
          calories: 50,
          nutrition: { carbs: 8, protein: 2, fat: 1, sugar: 3, sodium: 150 },
        },
      ],
      totalCalories: 330,
      totalNutrition: { carbs: 47, protein: 15, fat: 9, sugar: 7, sodium: 520 },
      eatingOrder: {
        goal: 'energy' as const,
        goalName: '졸림 방지',
        steps: [
          {
            order: 1,
            category: 'vegetable' as const,
            categoryName: '야채/섬유질',
            description: '샐러드를 먼저 드세요',
          },
          {
            order: 2,
            category: 'protein' as const,
            categoryName: '단백질',
            description: '계란 드세요',
          },
          {
            order: 3,
            category: 'carbohydrate' as const,
            categoryName: '탄수화물',
            description: '토스트는 마지막에',
          },
        ],
        reason: '야채와 단백질을 먼저 먹으면 혈당이 안정되어 졸음을 예방할 수 있습니다.',
      },
    },
    {
      imageUrl: '',
      foods: [
        {
          name: '오트밀',
          category: 'carbohydrate' as const,
          calories: 250,
          nutrition: { carbs: 45, protein: 8, fat: 4, sugar: 5, sodium: 100 },
        },
        {
          name: '요거트',
          category: 'protein' as const,
          calories: 120,
          nutrition: { carbs: 15, protein: 10, fat: 3, sugar: 12, sodium: 80 },
        },
        {
          name: '과일',
          category: 'sugar' as const,
          calories: 80,
          nutrition: { carbs: 20, protein: 1, fat: 0, sugar: 15, sodium: 0 },
        },
      ],
      totalCalories: 450,
      totalNutrition: { carbs: 80, protein: 19, fat: 7, sugar: 32, sodium: 180 },
      eatingOrder: {
        goal: 'satiety' as const,
        goalName: '포만감 유지',
        steps: [
          {
            order: 1,
            category: 'protein' as const,
            categoryName: '단백질',
            description: '요거트를 먼저',
          },
          {
            order: 2,
            category: 'carbohydrate' as const,
            categoryName: '탄수화물',
            description: '오트밀',
          },
          {
            order: 3,
            category: 'sugar' as const,
            categoryName: '과일',
            description: '마지막에 드세요',
          },
        ],
        reason: '단백질을 먼저 섭취하면 포만감이 오래 지속됩니다.',
      },
    },
  ];

  const lunchMeals = [
    {
      imageUrl: '',
      foods: [
        {
          name: '닭가슴살',
          category: 'protein' as const,
          calories: 165,
          nutrition: { carbs: 0, protein: 31, fat: 3.6, sugar: 0, sodium: 74 },
        },
        {
          name: '현미밥',
          category: 'carbohydrate' as const,
          calories: 210,
          nutrition: { carbs: 44, protein: 5, fat: 1.5, sugar: 0, sodium: 0 },
        },
        {
          name: '브로콜리',
          category: 'vegetable' as const,
          calories: 55,
          nutrition: { carbs: 11, protein: 3, fat: 0.4, sugar: 3, sodium: 50 },
        },
      ],
      totalCalories: 430,
      totalNutrition: { carbs: 55, protein: 39, fat: 5.5, sugar: 3, sodium: 124 },
      eatingOrder: {
        goal: 'satiety' as const,
        goalName: '포만감 유지',
        steps: [
          {
            order: 1,
            category: 'vegetable' as const,
            categoryName: '야채',
            description: '브로콜리 먼저',
          },
          {
            order: 2,
            category: 'protein' as const,
            categoryName: '단백질',
            description: '닭가슴살',
          },
          {
            order: 3,
            category: 'carbohydrate' as const,
            categoryName: '탄수화물',
            description: '현미밥 마지막',
          },
        ],
        reason: '채소와 단백질을 먼저 먹으면 탄수화물 흡수가 느려져 포만감이 오래갑니다.',
      },
    },
    {
      imageUrl: '',
      foods: [
        {
          name: '된장찌개',
          category: 'protein' as const,
          calories: 180,
          nutrition: { carbs: 12, protein: 15, fat: 8, sugar: 3, sodium: 800 },
        },
        {
          name: '밥',
          category: 'carbohydrate' as const,
          calories: 300,
          nutrition: { carbs: 68, protein: 6, fat: 1, sugar: 0, sodium: 0 },
        },
        {
          name: '김치',
          category: 'vegetable' as const,
          calories: 40,
          nutrition: { carbs: 8, protein: 2, fat: 0.5, sugar: 4, sodium: 600 },
        },
      ],
      totalCalories: 520,
      totalNutrition: { carbs: 88, protein: 23, fat: 9.5, sugar: 7, sodium: 1400 },
      eatingOrder: {
        goal: 'digestion' as const,
        goalName: '소화 편안함',
        steps: [
          {
            order: 1,
            category: 'vegetable' as const,
            categoryName: '채소',
            description: '김치',
          },
          {
            order: 2,
            category: 'protein' as const,
            categoryName: '단백질',
            description: '된장찌개',
          },
          {
            order: 3,
            category: 'carbohydrate' as const,
            categoryName: '탄수화물',
            description: '밥',
          },
        ],
        reason: '채소의 식이섬유가 소화를 돕고, 천천히 먹으면 속이 편안합니다.',
      },
    },
  ];

  const dinnerMeals = [
    {
      imageUrl: '',
      foods: [
        {
          name: '연어구이',
          category: 'protein' as const,
          calories: 280,
          nutrition: { carbs: 0, protein: 34, fat: 15, sugar: 0, sodium: 100 },
        },
        {
          name: '퀴노아',
          category: 'carbohydrate' as const,
          calories: 180,
          nutrition: { carbs: 32, protein: 6, fat: 3, sugar: 0, sodium: 10 },
        },
        {
          name: '구운야채',
          category: 'vegetable' as const,
          calories: 100,
          nutrition: { carbs: 18, protein: 3, fat: 2, sugar: 8, sodium: 200 },
        },
      ],
      totalCalories: 560,
      totalNutrition: { carbs: 50, protein: 43, fat: 20, sugar: 8, sodium: 310 },
      eatingOrder: {
        goal: 'digestion' as const,
        goalName: '소화 편안함',
        steps: [
          {
            order: 1,
            category: 'vegetable' as const,
            categoryName: '야채',
            description: '구운 야채 먼저',
          },
          {
            order: 2,
            category: 'protein' as const,
            categoryName: '단백질',
            description: '연어',
          },
          {
            order: 3,
            category: 'carbohydrate' as const,
            categoryName: '탄수화물',
            description: '퀴노아',
          },
        ],
        reason: '저녁에는 야채를 먼저 먹으면 소화가 편하고 숙면에 도움이 됩니다.',
      },
    },
  ];

  if (mealTime === 'breakfast') {
    return breakfastMeals[Math.floor(Math.random() * breakfastMeals.length)];
  } else if (mealTime === 'lunch') {
    return lunchMeals[Math.floor(Math.random() * lunchMeals.length)];
  } else {
    return dinnerMeals[Math.floor(Math.random() * dinnerMeals.length)];
  }
}

