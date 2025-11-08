import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card } from '../components/common';
import { FoodDetectionImage } from '../components/result';
import { saveDiary } from '../services/supabaseService';
import { analyzeFoodImage } from '../services/openai';
import type { MealTime, FoodDiary, MealAnalysis, FoodItem } from '../types';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const goal = location.state?.goal || 'satiety';
  const imageUrl = location.state?.imageUrl || '';

  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('lunch');
  const [analysisResult, setAnalysisResult] = useState<MealAnalysis | null>(null);
  const [editableFoods, setEditableFoods] = useState<FoodItem[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 이미지 분석
  useEffect(() => {
    async function analyzeImage() {
      if (!imageUrl) {
        setError('이미지를 찾을 수 없습니다.');
        setIsAnalyzing(false);
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        const result = await analyzeFoodImage(imageUrl, goal);
        setAnalysisResult(result);
        setEditableFoods(result.foods); // 편집 가능한 음식 목록 초기화
      } catch (error) {
        console.error('Failed to analyze image:', error);
        setError('음식 분석에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsAnalyzing(false);
      }
    }

    analyzeImage();
  }, [imageUrl, goal]);

  // 음식명 편집 시작
  const handleEditFood = (index: number) => {
    setEditingIndex(index);
    setEditedName(editableFoods[index].name);
  };

  // 음식명 저장
  const handleSaveFoodName = () => {
    if (editingIndex !== null && editedName.trim()) {
      const updatedFoods = [...editableFoods];
      updatedFoods[editingIndex] = {
        ...updatedFoods[editingIndex],
        name: editedName.trim(),
      };
      setEditableFoods(updatedFoods);
      setEditingIndex(null);
      setEditedName('');
    }
  };

  // 음식명 편집 취소
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedName('');
  };

  // 음식 확인 완료
  const handleConfirmFoods = () => {
    setIsConfirmed(true);
  };

  // 다이어리에 저장
  const handleSaveDiary = async () => {
    if (!analysisResult) {
      alert('분석 결과가 없습니다.');
      return;
    }

    const diary: Omit<FoodDiary, 'id'> = {
      mealTime: selectedMealTime,
      imageUrl: imageUrl,
      foods: editableFoods, // 수정된 음식 목록 사용
      totalCalories: analysisResult.totalCalories,
      totalNutrition: analysisResult.totalNutrition,
      eatingOrder: {
        ...analysisResult.eatingOrder,
        goalName: goal === 'satiety' ? '포만감 유지' : goal === 'digestion' ? '소화 편안함' : '졸림 방지',
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

  // 로딩 중
  if (isAnalyzing) {
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

        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              음식을 분석하는 중...
            </h2>
            <p className="text-sm text-text-secondary">
              AI가 음식을 인식하고 영양 정보를 계산하고 있어요
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error || !analysisResult) {
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

        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              분석 실패
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              {error || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <Button onClick={() => navigate(-1)}>돌아가기</Button>
          </div>
        </div>
      </div>
    );
  }

  // 분석 결과 표시
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
          {isConfirmed ? '이렇게 드세요!' : '감지된 음식을 확인해주세요'}
        </h1>

        {/* 업로드한 이미지 */}
        <div className="mb-6">
          <FoodDetectionImage imageUrl={imageUrl} />
        </div>

        {/* 감지된 음식 목록 */}
        {editableFoods.length > 0 && (
          <Card variant="flat" padding="md" className="mb-6">
            <p className="text-xs text-text-tertiary mb-2">감지된 음식</p>
            <div className="flex flex-wrap gap-2">
              {editableFoods.map((food, index) => (
                <button
                  key={index}
                  onClick={() => !isConfirmed && handleEditFood(index)}
                  disabled={isConfirmed}
                  className={`px-3 py-1.5 bg-white rounded-full text-xs font-medium text-text-primary border border-border ${
                    !isConfirmed ? 'cursor-pointer hover:border-primary hover:bg-primary-light transition-colors' : 'cursor-default'
                  }`}
                >
                  {food.name}
                </button>
              ))}
            </div>
            {!isConfirmed && (
              <p className="text-xs text-text-tertiary mt-3">
                💡 음식명을 클릭하면 수정할 수 있습니다
              </p>
            )}
          </Card>
        )}

        {/* 확인 버튼 (확인 전에만 표시) */}
        {!isConfirmed && (
          <div className="mb-6">
            <Button fullWidth onClick={handleConfirmFoods}>
              음식 확인 완료 ✓
            </Button>
          </div>
        )}

        {/* 확인 후 표시되는 섹션 */}
        {isConfirmed && (
          <>
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
                {analysisResult.eatingOrder.steps.map((step) => (
                  <div key={step.order} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold flex-shrink-0">
                      {step.order}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-text-primary">
                        {step.categoryName}
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
                  {analysisResult.eatingOrder.reason}
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
                  {analysisResult.totalCalories}
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
                      {analysisResult.totalNutrition.carbs}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.min((analysisResult.totalNutrition.carbs / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">단백질</span>
                    <span className="text-text-primary font-medium">
                      {analysisResult.totalNutrition.protein}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${Math.min((analysisResult.totalNutrition.protein / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">지방</span>
                    <span className="text-text-primary font-medium">
                      {analysisResult.totalNutrition.fat}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${Math.min((analysisResult.totalNutrition.fat / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* 기록하기 버튼 (확인 후에만 표시) */}
      {isConfirmed && (
        <div className="page-bottom">
          <Button fullWidth onClick={handleSaveDiary}>
            기록하기
          </Button>
        </div>
      )}

      {/* 음식명 수정 모달 */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              음식명 수정
            </h3>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary mb-4"
              placeholder="음식 이름을 입력하세요"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-3 bg-surface text-text-primary rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveFoodName}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                disabled={!editedName.trim()}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
