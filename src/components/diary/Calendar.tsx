import { useState, useEffect } from 'react';
import type { CalendarDate, MealTime } from '../../types';
import {
  generateMonthDates,
  formatMonth,
  getDayName,
  getPreviousMonth,
  getNextMonth,
  formatDateKey,
} from '../../utils/dateUtils';
import {
  getDiariesByMonth,
  getMealTimesByDate,
  getCachedCalendarData,
  setCachedCalendarData,
} from '../../services/supabaseService';

interface CalendarProps {
  onDateClick: (date: Date, meals: MealTime[]) => void;
}

export default function Calendar({ onDateClick }: CalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [dates, setDates] = useState<CalendarDate[]>([]);
  const [, setMealsByDate] = useState<Map<string, MealTime[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // 월별 데이터 로드 (캐시 우선)
  useEffect(() => {
    async function loadMonthData() {
      setIsLoading(true);
      const monthDates = generateMonthDates(currentYear, currentMonth);

      // 1. 캐시 확인
      const cachedDiaries = await getCachedCalendarData(currentYear, currentMonth);

      let diaries;
      if (cachedDiaries) {
        // 캐시 있음: 즉시 사용 (스켈레톤 스킵)
        diaries = cachedDiaries;
      } else {
        // 캐시 없음: DB에서 로드 후 캐시 저장
        diaries = await getDiariesByMonth(currentYear, currentMonth);
        await setCachedCalendarData(currentYear, currentMonth, diaries);
      }

      const mealsMap = getMealTimesByDate(diaries);

      // 각 날짜에 식사 정보 추가
      const updatedDates = monthDates.map((date) => {
        const dateKey = formatDateKey(date.date);
        const meals = mealsMap.get(dateKey) || [];
        return { ...date, meals };
      });

      setDates(updatedDates);
      setMealsByDate(mealsMap);
      setIsLoading(false);
    }
    loadMonthData();
  }, [currentYear, currentMonth]);

  const handlePreviousMonth = () => {
    const { year, month } = getPreviousMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleNextMonth = () => {
    const { year, month } = getNextMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleDateClick = (date: CalendarDate) => {
    if (!date.isCurrentMonth) return;
    onDateClick(date.date, date.meals);
  };

  // 식사별 파스텔 색상
  const getMealColor = (mealTime: MealTime): string => {
    const colors = {
      breakfast: 'bg-pastel-breakfast',
      lunch: 'bg-pastel-lunch',
      dinner: 'bg-pastel-dinner',
    };
    return colors[mealTime];
  };

  return (
    <div className="w-full">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={handlePreviousMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
          aria-label="이전 달"
        >
          <svg
            className="w-6 h-6 text-text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-text-primary">
          {formatMonth(currentYear, currentMonth)}
        </h2>

        <button
          onClick={handleNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
          aria-label="다음 달"
        >
          <svg
            className="w-6 h-6 text-text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
          <div
            key={dayIndex}
            className="text-center py-2 text-sm font-medium text-text-tertiary"
          >
            {getDayName(dayIndex)}
          </div>
        ))}
      </div>

      {/* 로딩 중: 스켈레톤 UI */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-lg bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        /* 날짜 그리드 */
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date, index) => {
            const isToday = date.isToday;
            const hasMeals = date.meals.length > 0;
            const isClickable = date.isCurrentMonth && hasMeals;

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!isClickable}
                className={`
                  aspect-square relative rounded-lg p-1 transition-all duration-200
                  ${
                    date.isCurrentMonth
                      ? 'text-text-primary'
                      : 'text-text-tertiary opacity-40'
                  }
                  ${isToday ? 'bg-primary-light' : ''}
                  ${
                    isClickable
                      ? 'hover:bg-surface hover:scale-105 cursor-pointer active:scale-95'
                      : ''
                  }
                  ${!date.isCurrentMonth ? 'cursor-default' : ''}
                `}
              >
                {/* 날짜 숫자 */}
                <div
                  className={`
                  text-sm font-medium mb-0.5
                  ${isToday ? 'text-primary font-semibold' : ''}
                `}
                >
                  {date.day}
                </div>

                {/* 식사 인디케이터 (작은 닷) */}
                {hasMeals && date.isCurrentMonth && (
                  <div className="flex items-center justify-center gap-0.5">
                    {date.meals.slice(0, 3).map((mealTime, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${getMealColor(mealTime)}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
