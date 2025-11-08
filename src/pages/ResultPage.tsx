import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card } from '../components/common';
import { FoodDetectionImage } from '../components/result';
import { saveDiary } from '../services/supabaseService';
import { detectFoods } from '../services/googleVision';
import type { MealTime, FoodDiary } from '../types';
import type { DetectedFood } from '../services/googleVision';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const goal = location.state?.goal || 'satiety';
  const imageUrl = location.state?.imageUrl || '/placeholder-food.jpg'; // 업로드한 이미지

  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('lunch');
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  // Mock data - 실제로는 AI 분석 결과를 사용
  console.log('Selected goal:', goal);
  const mockResult = {
    totalCalories: 520,
    steps: [
      { order: 1, name: '야채/섬유질', description: '먼저 드세요' },
      { order: 2, name: '단백질', description: '고기, 두부' },
      { order: 3, name: '탄수화물', description: '밥, 면은 마지막에' },
    ],
    reason: '섬유질·단백질을 먼저 먹으면 위 배출 속도가 느려져 포만감이 오래 유지됩니다.',
    nutrition: {
      carbs: 65,
      protein: 25,
      fat: 15,
    },
  };

  const handleSaveDiary = async () => {
    // Mock 식단 데이터 생성
    const diary: Omit<FoodDiary, 'id'> = {
      mealTime: selectedMealTime,
      imageUrl: imageUrl,
      foods: [
        {
          name: '된장찌개',
          category: 'protein',
          calories: 180,
          nutrition: { carbs: 12, protein: 15, fat: 8, sugar: 3, sodium: 800 },
        },
        {
          name: '밥',
          category: 'carbohydrate',
          calories: 300,
          nutrition: { carbs: 68, protein: 6, fat: 1, sugar: 0, sodium: 0 },
        },
        {
          name: '김치',
          category: 'vegetable',
          calories: 40,
          nutrition: { carbs: 8, protein: 2, fat: 0.5, sugar: 4, sodium: 600 },
        },
      ],
      totalCalories: mockResult.totalCalories,
      totalNutrition: {
        carbs: mockResult.nutrition.carbs,
        protein: mockResult.nutrition.protein,
        fat: mockResult.nutrition.fat,
        sugar: 7,
        sodium: 1400,
      },
      eatingOrder: {
        goal: goal,
        goalName: goal === 'satiety' ? '포만감 유지' : goal === 'digestion' ? '소화 편안함' : '졸림 방지',
        steps: mockResult.steps.map((step, idx) => ({
          order: step.order,
          category: idx === 0 ? 'vegetable' : idx === 1 ? 'protein' : 'carbohydrate',
          categoryName: step.name,
          description: step.description,
        })),
        reason: mockResult.reason,
      },
      timestamp: Date.now(),
    };

    await saveDiary(diary);
    navigate('/');
  };

  const mealTimeOptions = [
    { value: 'breakfast' as MealTime, label: '아침', icon: '🌅', color: 'bg-pastel-breakfast' },
    { value: 'lunch' as MealTime, label: '점심', icon: '☀️', color: 'bg-pastel-lunch' },
    { value: 'dinner' as MealTime, label: '저녁', icon: '🌙', color: 'bg-pastel-dinner' },
  ];

  // 이미지에서 음식 감지
  useEffect(() => {
    async function detectFoodsInImage() {
      setIsDetecting(true);
      try {
        // 실제로는 imageUrl을 base64로 변환해야 함
        // 여기서는 Mock 데이터 사용
        const foods = await detectFoods('');
        setDetectedFoods(foods);
      } catch (error) {
        console.error('Failed to detect foods:', error);
      } finally {
        setIsDetecting(false);
      }
    }

    detectFoodsInImage();
  }, [imageUrl]);

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
        <h1 className="text-[26px] font-bold text-text-primary mb-6 leading-[1.4]">
          이렇게 드세요!
        </h1>

        {/* 업로드한 이미지와 음식 감지 */}
        <div className="mb-6">
          {isDetecting ? (
            <div className="w-full h-64 bg-surface rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-text-secondary">음식을 분석하는 중...</p>
              </div>
            </div>
          ) : (
            <FoodDetectionImage imageUrl={imageUrl} detectedFoods={detectedFoods} />
          )}
        </div>

        {/* 감지된 음식 목록 */}
        {detectedFoods.length > 0 && !isDetecting && (
          <Card variant="flat" padding="md" className="mb-6">
            <p className="text-xs text-text-tertiary mb-2">감지된 음식</p>
            <div className="flex flex-wrap gap-2">
              {detectedFoods.map((food, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-text-primary border border-border"
                >
                  {food.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 식사 시간 선택 */}
        <div className="mb-6">
          <p className="text-sm text-text-secondary mb-3">언제 드시는 식사인가요?</p>
          <div className="flex gap-2">
            {mealTimeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedMealTime(option.value)}
                className={`
                  flex-1 py-3 px-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${
                    selectedMealTime === option.value
                      ? `${option.color} text-text-primary shadow-sm border-2 border-primary`
                      : 'bg-surface text-text-secondary hover:bg-gray-100 border-2 border-transparent'
                  }
                `}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 먹는 순서 카드 */}
        <Card variant="outlined" padding="lg" className="mb-4 border-primary">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            먹는 순서
          </h2>

          <div className="space-y-3 mb-4">
            {mockResult.steps.map((step) => (
              <div key={step.order} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold flex-shrink-0">
                  {step.order}
                </div>
                <div>
                  <h3 className="text-base font-medium text-text-primary">
                    {step.name}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-text-secondary leading-relaxed">
              {mockResult.reason}
            </p>
          </div>
        </Card>

        {/* 칼로리 및 영양 정보 */}
        <Card variant="default" padding="lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              영양 정보
            </h2>
            <p className="text-3xl font-bold text-primary">
              {mockResult.totalCalories}
              <span className="text-lg font-normal text-text-secondary ml-1">
                kcal
              </span>
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">탄수화물</span>
                <span className="text-text-primary font-medium">
                  {mockResult.nutrition.carbs}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${mockResult.nutrition.carbs}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">단백질</span>
                <span className="text-text-primary font-medium">
                  {mockResult.nutrition.protein}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${mockResult.nutrition.protein}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">지방</span>
                <span className="text-text-primary font-medium">
                  {mockResult.nutrition.fat}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${mockResult.nutrition.fat}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="page-bottom">
        <Button fullWidth onClick={handleSaveDiary}>
          기록하기
        </Button>
      </div>
    </div>
  );
}
