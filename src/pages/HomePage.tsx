import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common';
import { getRecentDiaries } from '../services/supabaseService';
import type { FoodDiary } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const [recentMeals, setRecentMeals] = useState<FoodDiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadRecentMeals() {
      try {
        const meals = await getRecentDiaries(3);
        setRecentMeals(meals);
      } catch (error) {
        console.error('Failed to load recent meals:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecentMeals();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      // 바로 goal 페이지로 이동
      navigate('/goal', { state: { imageUrl } });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const getMealTimeLabel = (mealTime: string) => {
    const labels = { breakfast: '아침', lunch: '점심', dinner: '저녁' };
    return labels[mealTime as keyof typeof labels] || mealTime;
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <h1 className="text-[26px] font-bold text-text-primary mb-8 leading-[1.4]">
          어떤 음식을 드세요?
          <br />
          플로잇이 순서를 알려드릴게요!
        </h1>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Card
          variant="default"
          padding="lg"
          clickable
          onClick={handleUploadClick}
          className="mb-8"
        >
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <img
              src="/icons/camera-3d.png"
              alt="사진 올리기"
              className="w-[120px] h-[120px] object-contain"
            />
            <p className="text-xl font-bold text-text-primary text-center">
              내 한 끼 사진 올리기
            </p>
            <p className="text-sm text-text-secondary text-center">
              사진 촬영 또는 갤러리에서 선택
            </p>
          </div>
        </Card>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-text-secondary">
              최근 기록
            </h2>
            <button
              onClick={() => navigate('/diary')}
              className="text-sm text-primary font-medium"
            >
              전체보기
            </button>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <Card variant="default" padding="md">
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </Card>
            ) : recentMeals.length > 0 ? (
              recentMeals.map((meal) => (
                <Card
                  key={meal.id}
                  variant="default"
                  padding="md"
                  clickable
                  onClick={() => navigate('/diary')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium">
                          {getMealTimeLabel(meal.mealTime)}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-text-primary">
                        {meal.foods.map((f) => f.name).join(', ')}
                      </h3>
                      <p className="text-sm text-text-tertiary mt-1">
                        {formatTimeAgo(meal.timestamp)}
                      </p>
                    </div>
                    {meal.imageUrl && (
                      <img
                        src={meal.imageUrl}
                        alt="음식 사진"
                        className="w-16 h-16 bg-surface rounded-lg object-cover"
                      />
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card variant="flat" padding="lg" className="bg-surface">
                <div className="text-center py-8">
                  <p className="text-sm text-text-secondary mb-2">
                    아직 기록이 없습니다
                  </p>
                  <p className="text-xs text-text-tertiary">
                    첫 식사를 기록해보세요!
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
