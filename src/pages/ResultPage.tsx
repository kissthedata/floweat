import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button, Card } from '../components/common';
import { FoodDetectionImage } from '../components/result';
import { saveDiary } from '../services/supabaseService';
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
    if (!finalAnalysis) return;

    const diary: Omit<FoodDiary, 'id'> = {
      mealTime: selectedMealTime,
      imageUrl: finalAnalysis.imageUrl,
      foods: finalAnalysis.foods,
      totalNutrition: finalAnalysis.totalNutrition,
      eatingOrder: finalAnalysis.eatingOrder,
      timestamp: finalAnalysis.timestamp,
    };

    await saveDiary(diary);
    navigate('/');
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
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              음식을 감지하는 중...
            </h2>
            <p className="text-sm text-text-secondary">
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
              음식 확인 완료 ✓
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
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              영양 정보를 분석하는 중...
            </h2>
            <p className="text-sm text-text-secondary">
              AI가 영양 정보와 먹는 순서를 계산하고 있어요
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

          {/* 업로드한 음식 이미지 */}
          <div className="mb-6">
            <FoodDetectionImage imageUrl={finalAnalysis.imageUrl} />
          </div>

          {/* 먹는 순서 카드 */}
          <Card variant="outlined" padding="lg" className="mb-4 border-primary">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              먹는 순서
            </h2>

            <div className="space-y-3 mb-4">
              {finalAnalysis.eatingOrder.steps.map((step) => (
                <div key={step.order} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold flex-shrink-0">
                    {step.order}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-text-primary">
                      {step.foodName}
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
          <Button fullWidth onClick={handleSaveDiary}>
            기록하기
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
