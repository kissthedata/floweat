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

        {/* 예시 사진 다운로드 섹션 */}
        <div className="mt-10">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              지금 한 끼 사진이 없나요?
            </h2>
            <p className="text-sm text-text-secondary">
              아래 사진을 다운해서 올려보세요!
            </p>
          </div>

          <Card variant="default" padding="lg" className="mb-4">
            <img
              src="/examples/sample-meal.jpg"
              alt="예시 음식 사진"
              className="w-full h-48 object-cover rounded-lg mb-4"
              onError={(e) => {
                // 이미지 로드 실패 시 placeholder
                e.currentTarget.src = 'https://via.placeholder.com/400x300/d4fdc8/4ae523?text=Sample+Meal';
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/examples/sample-meal.jpg';
                  link.download = 'sample-meal.jpg';
                  link.click();
                }}
                className="flex-1 h-14 bg-surface text-text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                다운로드
              </button>
              <button
                onClick={() => {
                  // 예시 이미지를 base64로 변환하여 GoalPage로 이동
                  fetch('/examples/sample-meal.jpg')
                    .then(res => res.blob())
                    .then(blob => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        navigate('/goal', { state: { imageUrl: reader.result as string } });
                      };
                      reader.readAsDataURL(blob);
                    })
                    .catch(() => {
                      // placeholder 사용
                      navigate('/goal', {
                        state: { imageUrl: 'https://via.placeholder.com/400x300/d4fdc8/4ae523?text=Sample+Meal' }
                      });
                    });
                }}
                className="flex-1 h-14 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                바로 시작
              </button>
            </div>
          </Card>
        </div>

        {/* 설문조사 섹션 */}
        <div className="mt-10">
          <Card variant="default" padding="lg" className="text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              플로잇 사용 경험을 알려주세요!
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              여러분의 소중한 의견이 서비스 개선에 큰 도움이 됩니다
            </p>
            <button
              onClick={() => navigate('/survey')}
              className="w-full h-14 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              설문하기
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
