import { useEffect, useState } from 'react';
import type { FoodDiary, MealTime } from '../../types';
import { getDiariesByDate, deleteDiary, invalidateCalendarCache } from '../../services/supabaseService';
import { formatDate } from '../../utils/dateUtils';
import { Card } from '../common';

interface DayDetailModalProps {
  date: Date | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function DayDetailModal({ date, onClose, onRefresh }: DayDetailModalProps) {
  const [diaries, setDiaries] = useState<FoodDiary[]>([]);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('breakfast');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (date) {
      async function loadDiaries() {
        setIsLoading(true);
        const dayDiaries = await getDiariesByDate(date!);
        setDiaries(dayDiaries);

        // 첫 번째 식사로 자동 선택
        if (dayDiaries.length > 0) {
          setSelectedMealTime(dayDiaries[0].mealTime);
        }
        setIsLoading(false);
      }
      loadDiaries();
    }
  }, [date]);

  if (!date) return null;

  const currentDiaries = diaries.filter((d) => d.mealTime === selectedMealTime);
  const availableMealTimes = diaries.map((d) => d.mealTime);

  const mealTimeInfo = {
    breakfast: { name: '아침', color: 'bg-pastel-breakfast', icon: '🌅' },
    lunch: { name: '점심', color: 'bg-pastel-lunch', icon: '☀️' },
    dinner: { name: '저녁', color: 'bg-pastel-dinner', icon: '🌙' },
  };

  const handleDelete = async (diaryId: string) => {
    if (window.confirm('이 식사 기록을 삭제하시겠습니까?')) {
      await deleteDiary(diaryId);

      // 캐시 무효화 (삭제된 diary의 월)
      if (date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        await invalidateCalendarCache(year, month);
      }

      if (onRefresh) onRefresh();

      // 현재 modal의 diaries 업데이트
      const updatedDiaries = diaries.filter((d) => d.id !== diaryId);
      setDiaries(updatedDiaries);

      // 삭제 후 남은 기록이 없으면 modal 닫기
      if (updatedDiaries.length === 0) {
        onClose();
      }
    }
  };

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
            총 {diaries.length}번의 식사
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
        {isLoading ? (
          <div className="px-6 py-8 text-center">
            <p className="text-text-secondary">정보를 불러오고 있습니다! 조금만 기다려 주세요</p>
          </div>
        ) : currentDiaries.length > 0 ? (
          <div className="px-6 py-5 space-y-6">
            {currentDiaries.map((currentDiary, diaryIndex) => (
              <div key={currentDiary.id} className="relative">
                {/* 중복 식사 표시 */}
                {currentDiaries.length > 1 && (
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-text-primary">
                      {mealTimeInfo[selectedMealTime].name} {diaryIndex + 1}
                    </h4>
                    <button
                      onClick={() => handleDelete(currentDiary.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                )}

                {/* 단일 식사인 경우 삭제 버튼만 */}
                {currentDiaries.length === 1 && (
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={() => handleDelete(currentDiary.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                )}

                {/* 음식 목록 */}
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-3">
                    음식 목록
                  </h3>
                  <div className="space-y-2">
                    {currentDiary.foods.map((food, index) => (
                      <Card key={index} variant="default" padding="md">
                        <p className="text-sm font-medium text-text-primary">
                          {food.name}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* 구분선 (마지막 항목 제외) */}
                {diaryIndex < currentDiaries.length - 1 && (
                  <div className="mt-6 pt-6 border-t border-border"></div>
                )}
              </div>
            ))}
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
