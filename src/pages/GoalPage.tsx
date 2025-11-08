import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card } from '../components/common';
import type { EatingGoal } from '../types';

const GOALS: { id: EatingGoal; name: string; description: string }[] = [
  {
    id: 'digestion',
    name: '소화 편안',
    description: '편안한 소화를 위한 순서',
  },
  {
    id: 'satiety',
    name: '포만감 유지',
    description: '오래 지속되는 포만감',
  },
  {
    id: 'energy',
    name: '졸림 방지',
    description: '식후 피로를 줄이는 방법',
  },
];

export default function GoalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedGoal, setSelectedGoal] = useState<EatingGoal | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    // 이전 페이지에서 전달받은 이미지 URL 확인
    const state = location.state as { imageUrl?: string };
    if (state?.imageUrl) {
      setImageUrl(state.imageUrl);
    } else {
      // localStorage에서 확인 (fallback)
      const tempImage = localStorage.getItem('tempFoodImage');
      if (tempImage) {
        setImageUrl(tempImage);
      } else {
        // 이미지가 없으면 홈으로 리다이렉트
        navigate('/');
      }
    }
  }, [location, navigate]);

  const handleAnalyze = () => {
    if (selectedGoal && imageUrl) {
      navigate('/result', { state: { goal: selectedGoal, imageUrl } });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center"
        >
          <img
            src="/components/arrow_back.png"
            alt="뒤로가기"
            className="w-6 h-6"
          />
        </button>
      </div>

      <div className="page-content">
        <h1 className="text-[26px] font-bold text-text-primary mb-8 leading-[1.4]">
          어떤 식사를
          <br />
           원하세요?
        </h1>

        <div className="space-y-3">
          {GOALS.map((goal) => (
            <Card
              key={goal.id}
              variant={selectedGoal === goal.id ? 'outlined' : 'default'}
              padding="lg"
              clickable
              onClick={() => setSelectedGoal(goal.id)}
              className={
                selectedGoal === goal.id ? 'border-primary bg-primary-light' : ''
              }
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedGoal === goal.id
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedGoal === goal.id && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-medium text-text-primary">
                    {goal.name}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {goal.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="page-bottom">
        <Button
          fullWidth
          disabled={!selectedGoal}
          onClick={handleAnalyze}
        >
          분석 시작
        </Button>
      </div>
    </div>
  );
}
