import { useEffect, useState } from 'react';
import type { FoodDiary, MealTime } from '../../types';
import { getDiariesByDate } from '../../services/supabaseService';
import { formatDate } from '../../utils/dateUtils';
import { Card } from '../common';

interface DayDetailModalProps {
  date: Date | null;
  onClose: () => void;
}

export default function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const [diaries, setDiaries] = useState<FoodDiary[]>([]);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('breakfast');

  useEffect(() => {
    if (date) {
      async function loadDiaries() {
        const dayDiaries = await getDiariesByDate(date);
        setDiaries(dayDiaries);

        // 첫 번째 식사로 자동 선택
        if (dayDiaries.length > 0) {
          setSelectedMealTime(dayDiaries[0].mealTime);
        }
      }
      loadDiaries();
    }
  }, [date]);

  if (!date) return null;

  const currentDiary = diaries.find((d) => d.mealTime === selectedMealTime);
  const availableMealTimes = diaries.map((d) => d.mealTime);

  const mealTimeInfo = {
    breakfast: { name: '아침', color: 'bg-pastel-breakfast', icon: '🌅' },
    lunch: { name: '점심', color: 'bg-pastel-lunch', icon: '☀️' },
    dinner: { name: '저녁', color: 'bg-pastel-dinner', icon: '🌙' },
  };

  // 전체 칼로리 계산
  const totalDayCalories = diaries.reduce((sum, d) => sum + d.totalCalories, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-text-primary">
              {formatDate(date, 'short')}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
            >
              <svg
                className="w-5 h-5 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            총 {diaries.length}번의 식사 · {totalDayCalories}kcal
          </p>
        </div>

        {/* 식사 시간 탭 */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex gap-2">
            {(['breakfast', 'lunch', 'dinner'] as MealTime[]).map((mealTime) => {
              const isAvailable = availableMealTimes.includes(mealTime);
              const isSelected = selectedMealTime === mealTime;
              const info = mealTimeInfo[mealTime];

              return (
                <button
                  key={mealTime}
                  onClick={() => isAvailable && setSelectedMealTime(mealTime)}
                  disabled={!isAvailable}
                  className={`
                    flex-1 py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-200
                    ${
                      isSelected
                        ? `${info.color} text-text-primary shadow-sm`
                        : isAvailable
                        ? 'bg-surface text-text-secondary hover:bg-gray-100'
                        : 'bg-surface text-text-tertiary cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  <span className="mr-1">{info.icon}</span>
                  {info.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 식사 상세 내용 */}
        {currentDiary ? (
          <div className="px-6 py-5">
            {/* 칼로리 정보 */}
            <Card variant="flat" padding="lg" className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-text-primary">
                  영양 정보
                </h3>
                <div className="text-2xl font-bold text-primary">
                  {currentDiary.totalCalories}
                  <span className="text-sm font-normal text-text-secondary ml-1">
                    kcal
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">탄수화물</span>
                    <span className="text-text-primary font-medium">
                      {currentDiary.totalNutrition.carbs}g
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pastel-breakfast rounded-full"
                      style={{
                        width: `${
                          (currentDiary.totalNutrition.carbs /
                            (currentDiary.totalNutrition.carbs +
                              currentDiary.totalNutrition.protein +
                              currentDiary.totalNutrition.fat)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">단백질</span>
                    <span className="text-text-primary font-medium">
                      {currentDiary.totalNutrition.protein}g
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pastel-lunch rounded-full"
                      style={{
                        width: `${
                          (currentDiary.totalNutrition.protein /
                            (currentDiary.totalNutrition.carbs +
                              currentDiary.totalNutrition.protein +
                              currentDiary.totalNutrition.fat)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">지방</span>
                    <span className="text-text-primary font-medium">
                      {currentDiary.totalNutrition.fat}g
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pastel-dinner rounded-full"
                      style={{
                        width: `${
                          (currentDiary.totalNutrition.fat /
                            (currentDiary.totalNutrition.carbs +
                              currentDiary.totalNutrition.protein +
                              currentDiary.totalNutrition.fat)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 음식 목록 */}
            <div>
              <h3 className="text-base font-semibold text-text-primary mb-3">
                음식 목록
              </h3>
              <div className="space-y-2">
                {currentDiary.foods.map((food, index) => (
                  <Card key={index} variant="default" padding="md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {food.name}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          탄 {food.nutrition.carbs}g · 단 {food.nutrition.protein}g · 지{' '}
                          {food.nutrition.fat}g
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-text-primary">
                        {food.calories}kcal
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-text-tertiary">해당 식사 기록이 없습니다</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
