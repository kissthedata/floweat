import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button, Card } from '../components/common';
import Spinner from '../components/common/Spinner';
import { FoodDetectionImage } from '../components/result';
import { saveDiary, invalidateCalendarCache } from '../services/supabaseService';
import { detectFoodsFromImage, analyzeNutritionAndOrder } from '../services/openai';
import type { MealTime, FoodDiary, MealAnalysis, FoodCategory } from '../types';

type Phase = 'detecting' | 'confirming' | 'analyzing' | 'done';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const goal = location.state?.goal || 'satiety';
  const imageUrl = location.state?.imageUrl || '';

  const [phase, setPhase] = useState<Phase>('detecting');
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('lunch');
  const [detectedFoods, setDetectedFoods] = useState<{ name: string; category: FoodCategory }[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState<MealAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Phase 1: 음식 감지
  useEffect(() => {
    async function detectFoods() {
      if (!imageUrl) {
        setError('이미지를 찾을 수 없습니다.');
        return;
      }

      try {
        const foods = await detectFoodsFromImage(imageUrl);
        setDetectedFoods(foods);
        setPhase('confirming');
      } catch (err) {
        console.error('Failed to detect foods:', err);
        setError('음식 감지에 실패했습니다.');
      }
    }

    detectFoods();
  }, [imageUrl]);

  // 음식 추가
  const handleAddFood = () => {
    const name = prompt('추가할 음식 이름:');
    if (!name) return;

    setDetectedFoods([...detectedFoods, {
      name: name.trim(),
      category: 'carbohydrate' // 기본값
    }]);
  };

  // 음식 수정
  const handleEditFood = (index: number) => {
    setEditingIndex(index);
    setEditedName(detectedFoods[index].name);
  };

  const handleSaveFoodName = () => {
    if (editingIndex !== null && editedName.trim()) {
      const updated = [...detectedFoods];
      updated[editingIndex].name = editedName.trim();
      setDetectedFoods(updated);
      setEditingIndex(null);
      setEditedName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedName('');
  };

  // Phase 3: 음식 확인 완료 → 영양 분석
  const handleConfirmFoods = async () => {
    setPhase('analyzing');

    try {
      const result = await analyzeNutritionAndOrder(detectedFoods, goal);

      setFinalAnalysis({
        ...result,
        imageUrl,
        timestamp: Date.now()
      });

      setPhase('done');
    } catch (err) {
      console.error('Failed to analyze:', err);
      setError('영양 분석에 실패했습니다.');
      setPhase('confirming');
    }
  };

  // 기록 저장
  const handleSaveDiary = async () => {
    if (!finalAnalysis || isSaving) return; // 중복 클릭 방지

    setIsSaving(true);
    setSaveError(null);

    try {
      const diary: Omit<FoodDiary, 'id'> = {
        mealTime: selectedMealTime,
        imageUrl: finalAnalysis.imageUrl,
        foods: finalAnalysis.foods,
        totalNutrition: finalAnalysis.totalNutrition,
        eatingOrder: finalAnalysis.eatingOrder,
        timestamp: finalAnalysis.timestamp,
      };

      const result = await saveDiary(diary);

      if (!result) {
        throw new Error('기록 저장에 실패했습니다.');
      }

      // 캐시 무효화 (저장된 diary의 월)
      const savedDate = new Date(finalAnalysis.timestamp);
      const year = savedDate.getFullYear();
      const month = savedDate.getMonth();
      await invalidateCalendarCache(year, month);

      navigate('/');
    } catch (err) {
      console.error('Failed to save diary:', err);
      setSaveError('기록 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const mealTimeOptions = [
    { value: 'breakfast' as MealTime, label: '아침', icon: '🌅', color: 'bg-pastel-breakfast' },
    { value: 'lunch' as MealTime, label: '점심', icon: '☀️', color: 'bg-pastel-lunch' },
    { value: 'dinner' as MealTime, label: '저녁', icon: '🌙', color: 'bg-pastel-dinner' },
  ];

  // === Phase 1: 감지 중 ===
  if (phase === 'detecting') {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center">
            <img src="/components/arrow_back.png" alt="뒤로가기" className="w-6 h-6" />
          </button>
        </div>

        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="loader"></div>
            <p className="text-sm text-text-secondary mt-4">
              AI가 사진에서 음식을 찾고 있어요
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === 에러 발생 ===
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center">
            <img src="/components/arrow_back.png" alt="뒤로가기" className="w-6 h-6" />
          </button>
        </div>

        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">분석 실패</h2>
            <p className="text-sm text-text-secondary mb-6">{error}</p>
            <Button onClick={() => navigate(-1)}>돌아가기</Button>
          </div>
        </div>
      </div>
    );
  }

  // === Phase 2: 음식 확인 ===
  if (phase === 'confirming') {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center">
            <img src="/components/arrow_back.png" alt="뒤로가기" className="w-6 h-6" />
          </button>
        </div>

        <div className="page-content">
          <h1 className="text-[26px] font-bold text-text-primary mb-6 leading-[1.4]">
            감지된 음식을 확인해주세요
          </h1>

          {/* 업로드한 이미지 */}
          <div className="mb-6">
            <FoodDetectionImage imageUrl={imageUrl} />
          </div>

          {/* 감지된 음식 목록 */}
          <Card variant="flat" padding="md" className="mb-6">
            <p className="text-xs text-text-tertiary mb-2">감지된 음식</p>
            <div className="flex flex-wrap gap-2">
              {detectedFoods.map((food, index) => (
                <button
                  key={index}
                  onClick={() => handleEditFood(index)}
                  className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-text-primary border border-border cursor-pointer hover:border-primary hover:bg-primary-light transition-colors"
                >
                  {food.name}
                </button>
              ))}

              {/* + 버튼 */}
              <button
                onClick={handleAddFood}
                className="px-3 py-1.5 bg-primary text-white rounded-full text-xs font-medium hover:bg-primary-dark transition-colors"
              >
                + 음식 추가
              </button>
            </div>
            <p className="text-xs text-text-tertiary mt-3">
              💡 음식명을 클릭하면 수정할 수 있습니다
            </p>
          </Card>

          {/* 확인 버튼 */}
          <div className="mb-6">
            <Button fullWidth onClick={handleConfirmFoods}>
              음식 확인 완료
            </Button>
          </div>
        </div>

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

  // === Phase 3: 분석 중 ===
  if (phase === 'analyzing') {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center">
            <img src="/components/arrow_back.png" alt="뒤로가기" className="w-6 h-6" />
          </button>
        </div>

        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="loader"></div>
            <p className="text-sm text-text-secondary mt-4">
              AI가 영양 정보와 먹는 순서를 계산하고 있어요! 15초 정도 소요돼요!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === Phase 4: 결과 표시 ===
  if (phase === 'done' && finalAnalysis) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center">
            <img src="/components/arrow_back.png" alt="뒤로가기" className="w-6 h-6" />
          </button>
        </div>

        <div className="page-content">
          <h1 className="text-[26px] font-bold text-text-primary mb-6 leading-[1.4]">
            이렇게 드세요!
          </h1>

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
                        ? `${option.color} text-text-primary shadow-lg transform scale-105`
                        : 'bg-white text-text-primary hover:bg-gray-50 hover:-translate-y-0.5 shadow-sm'
                    }
                  `}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 업로드한 음식 이미지 */}
          <div className="mb-6">
            <FoodDetectionImage imageUrl={finalAnalysis.imageUrl} />
          </div>

          {/* 목표별 식사 가이드 배너 */}
          {finalAnalysis.eatingOrder.eatingGuide && (
            <Card variant="outlined" className="mb-4 border-primary bg-primary-light">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {finalAnalysis.eatingOrder.goal === 'weight' ? '🎯' :
                   finalAnalysis.eatingOrder.goal === 'energy' ? '⚡' :
                   finalAnalysis.eatingOrder.goal === 'satiety' ? '💪' : '🌿'}
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-primary mb-1">
                    {finalAnalysis.eatingOrder.goalName} 식사법
                  </h4>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {finalAnalysis.eatingOrder.eatingGuide}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 먹는 순서 카드 */}
          <Card variant="outlined" padding="lg" className="mb-4 border-primary">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              먹는 순서
            </h2>

            <div className="space-y-4 mb-4">
              {finalAnalysis.eatingOrder.steps.map((step, index) => {
                // Extract wait time from description (e.g., "⏱️ 10분 정도 기다려주세요")
                const timeMatch = step.description.match(/⏱️.*?(\d+)분/);
                const waitMinutes = timeMatch ? parseInt(timeMatch[1]) : null;
                const isLastStep = index === finalAnalysis.eatingOrder.steps.length - 1;

                return (
                  <div key={step.order}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold flex-shrink-0">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-text-primary">
                          {step.foodName}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                          {step.description}
                        </p>

                        {/* 타이머 추가 */}
                        {waitMinutes && !isLastStep && (
                          <SimpleTimer
                            minutes={waitMinutes}
                            stepName={step.foodName}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-secondary leading-relaxed">
                {finalAnalysis.eatingOrder.reason}
              </p>
            </div>
          </Card>

          {/* 영양 성분 파이 그래프 (탄단지 3개만) */}
          <Card variant="default" padding="lg" className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              영양 성분 분석
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: '탄수화물', value: finalAnalysis.totalNutrition.carbs, color: '#3b82f6' },
                    { name: '단백질', value: finalAnalysis.totalNutrition.protein, color: '#ef4444' },
                    { name: '지방', value: finalAnalysis.totalNutrition.fat, color: '#f59e0b' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                    const RADIAN = Math.PI / 180;

                    // 내부 퍼센티지 위치
                    const innerRadius2 = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const innerX = cx + innerRadius2 * Math.cos(-midAngle * RADIAN);
                    const innerY = cy + innerRadius2 * Math.sin(-midAngle * RADIAN);

                    // 외부 이름 위치
                    const outerRadius2 = outerRadius + 30;
                    const outerX = cx + outerRadius2 * Math.cos(-midAngle * RADIAN);
                    const outerY = cy + outerRadius2 * Math.sin(-midAngle * RADIAN);

                    return (
                      <g>
                        {/* 내부 퍼센티지 */}
                        <text
                          x={innerX}
                          y={innerY}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="14"
                          fontWeight="bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                        {/* 외부 이름 */}
                        <text
                          x={outerX}
                          y={outerY}
                          fill="#191919"
                          textAnchor={outerX > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize="13"
                          fontWeight="500"
                        >
                          {name}
                        </text>
                      </g>
                    );
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: '탄수화물', value: finalAnalysis.totalNutrition.carbs, color: '#3b82f6' },
                    { name: '단백질', value: finalAnalysis.totalNutrition.protein, color: '#ef4444' },
                    { name: '지방', value: finalAnalysis.totalNutrition.fat, color: '#f59e0b' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* AI 영양 분석 코멘트 */}
            {finalAnalysis.nutritionAnalysis && (
              <div className="mt-3 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {finalAnalysis.nutritionAnalysis}
                </p>
              </div>
            )}
          </Card>

          {/* 음식별 영양 효능 */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary">
              음식별 영양 정보
            </h2>
            {finalAnalysis.foods.map((food, index) => (
              <Card key={index} variant="default" padding="md">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">
                      {food.category === 'vegetable' ? '🥗' :
                       food.category === 'protein' ? '🍖' :
                       food.category === 'fat' ? '🧈' :
                       food.category === 'carbohydrate' ? '🍚' : '🍬'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base text-text-primary">{food.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-text-tertiary">
                        {food.category === 'vegetable' ? '채소' :
                         food.category === 'protein' ? '단백질' :
                         food.category === 'fat' ? '지방' :
                         food.category === 'carbohydrate' ? '탄수화물' : '당류'}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {food.nutritionBenefits}
                    </p>

                    {/* 주의사항 */}
                    {food.warnings && (
                      <div className="mt-2 space-y-1">
                        {food.warnings.timing && (
                          <div className="flex items-start gap-1.5 text-xs text-orange-600">
                            <span>⏰</span>
                            <span>{food.warnings.timing}</span>
                          </div>
                        )}
                        {food.warnings.overconsumption && (
                          <div className="flex items-start gap-1.5 text-xs text-red-600">
                            <span>⚠️</span>
                            <span>{food.warnings.overconsumption}</span>
                          </div>
                        )}
                        {food.warnings.general && (
                          <div className="flex items-start gap-1.5 text-xs text-amber-600">
                            <span>💡</span>
                            <span>{food.warnings.general}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 기록하기 버튼 */}
        <div className="page-bottom">
          {saveError && (
            <div className="mb-3 p-3 bg-red-50 rounded-xl text-sm text-red-600">
              {saveError}
            </div>
          )}
          <Button fullWidth onClick={handleSaveDiary} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" color="#ffffff" />
                저장 중...
              </span>
            ) : (
              '기록하기'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// Simple Timer Component
function SimpleTimer({ minutes, stepName }: { minutes: number; stepName: string }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((minutes * 60 - timeLeft) / (minutes * 60)) * 100;

  return (
    <div className="mt-3 p-3 bg-surface rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary">
          💡 {stepName} 몇 입 드신 후 시작하세요
        </span>
        <span className={`text-base font-bold ${timeLeft === 0 ? 'text-primary' : 'text-text-primary'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-2">
        {!isRunning && timeLeft > 0 ? (
          <button
            onClick={() => setIsRunning(true)}
            className="flex-1 h-9 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            먹기 시작!
          </button>
        ) : timeLeft > 0 ? (
          <button
            onClick={() => setIsRunning(false)}
            className="flex-1 h-9 bg-surface text-text-primary rounded-lg text-sm font-medium border border-border hover:bg-gray-100 transition-colors"
          >
            일시정지
          </button>
        ) : null}

        {timeLeft > 0 && (
          <button
            onClick={() => {
              setTimeLeft(0);
              setIsRunning(false);
            }}
            className="flex-1 h-9 bg-surface text-text-secondary rounded-lg text-sm font-medium border border-border hover:bg-gray-100 transition-colors"
          >
            건너뛰기
          </button>
        )}
      </div>

      {timeLeft === 0 && (
        <div className="mt-2 p-2 bg-primary-light rounded-lg">
          <p className="text-sm text-primary font-semibold text-center">
            ✅ 충분합니다! 이제 다음 음식으로 넘어가세요
          </p>
        </div>
      )}
    </div>
  );
}
