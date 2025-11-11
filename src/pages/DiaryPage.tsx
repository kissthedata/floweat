import { useState, useEffect } from 'react';
import { Calendar, DayDetailModal } from '../components/diary';
import { Card } from '../components/common';
import { getMonthlyStats, getAllDiaries } from '../services/supabaseService';
import type { MealTime } from '../types';

export default function DiaryPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ totalMeals: 0, totalCalories: 0, avgCalories: 0, mealCounts: { breakfast: 0, lunch: 0, dinner: 0 } });
  const [hasDiaries, setHasDiaries] = useState(false);

  const today = new Date();

  // 통계 로드
  useEffect(() => {
    async function loadStats() {
      const monthStats = await getMonthlyStats(today.getFullYear(), today.getMonth());
      setStats(monthStats);

      const diaries = await getAllDiaries();
      setHasDiaries(diaries.length > 0);
    }
    loadStats();
  }, [refreshKey]);

  const handleDateClick = (date: Date, meals: MealTime[]) => {
    if (meals.length > 0) {
      setSelectedDate(date);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedDate(null), 300);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-lg font-semibold text-text-primary ml-4">
          식단 기록
        </h1>
      </div>

      <div className="page-content">
        {/* 캘린더 */}
        <Card variant="default" padding="lg">
          <Calendar key={refreshKey} onDateClick={handleDateClick} />
        </Card>
      </div>

      {/* 날짜 상세 모달 */}
      {isModalOpen && (
        <DayDetailModal
          date={selectedDate}
          onClose={handleCloseModal}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
