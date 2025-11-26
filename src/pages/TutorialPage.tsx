import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common';
import { markTutorialCompleted } from '../services/userPreferencesService';

export default function TutorialPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const totalSteps = 4;

  const nextStep = () => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      setFadeIn(true);
    }, 200);
  };

  const prevStep = () => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setFadeIn(true);
    }, 200);
  };

  const handleSkip = async () => {
    try {
      console.log('[TutorialPage] handleSkip called');
      await markTutorialCompleted();
      console.log('[TutorialPage] Tutorial marked as completed (skip)');
      navigate('/', { state: { tutorialCompleted: true } });
      console.log('[TutorialPage] Navigation triggered (skip)');
    } catch (error) {
      console.error('Failed to mark tutorial as completed:', error);
      // 에러가 발생해도 홈으로 이동
      navigate('/', { state: { tutorialCompleted: true } });
    }
  };

  const handleComplete = () => {
    try {
      console.log('[TutorialPage] handleComplete called');
      markTutorialCompleted(); // sessionStorage.setItem은 동기 함수
      console.log('[TutorialPage] Tutorial marked as completed, navigating...');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to mark tutorial as completed:', error);
      navigate('/', { replace: true });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <TutorialStep
            headerImage="/icons/tutorial_1.png?v=2"
            title="같은 음식, 다른 순서"
            description="일단, 먹는 순서만 바꾸는 것 부터 시작해봐요."
            highlights={[
              '같은 식단이라도 순서에 따라 혈당, 소화, 포만감이 달라져요',
              '먹는 순서를 교정해 건강 목표를 효과적으로 달성할 수 있어요',
            ]}
            stepNumber={1}
            totalSteps={totalSteps}
            onNext={nextStep}
            onPrev={prevStep}
            showPrev={false}
          />
        );

      case 1:
        return (
          <TutorialStep
            headerImage="/icons/tutorial_2.png"
            title="지금 당신에게 필요한 것은?"
            description="매 식사마다 다른 목표를 선택할 수 있어요"
            highlights={[
              '🌿 편안한 소화를 원할 때',
              '💪 오래 배부르고 싶을 때',
              '⚡ 식곤증을 피하고 싶을 때',
            ]}
            stepNumber={2}
            totalSteps={totalSteps}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );

      case 2:
        return (
          <TutorialStep
            headerImage="/icons/tutorial_3.png"
            title="사진 한 장이면 끝"
            description="복잡한 입력 없이 간단하게 시작하세요"
            highlights={[
              '1️⃣ 식사 사진 촬영',
              '2️⃣ 목표 선택 (소화/포만감/졸림 방지 등)',
              '3️⃣ AI가 음식을 분석하고 최적의 순서 제안',
            ]}
            stepNumber={3}
            totalSteps={totalSteps}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );

      case 3:
        return (
          <TutorialStep
            headerImage="/icons/tutorial_4.png"
            title="식사 순서를 제안해드릴게요"
            description="목표에 맞는 최적의 먹는 순서를 받아보세요"
            highlights={[
              '목표별 맞춤 순서 추천',
              '영양 정보 자동 분석',
              '식사 기록 자동 저장',
            ]}
            stepNumber={4}
            totalSteps={totalSteps}
            onNext={handleComplete}
            onPrev={prevStep}
            nextLabel="지금 시작하기"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      {/* 헤더: 건너뛰기 버튼 + 진행률 표시 */}
      <div className="pt-4 pb-4 px-4">
        {/* 건너뛰기 버튼 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSkip}
            className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
          >
            건너뛰기
          </button>
        </div>

        {/* 진행률 바 */}
        <div className="flex gap-1 justify-center">
          {[...Array(totalSteps)].map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= currentStep ? 'bg-[#25ba25]' : 'bg-[#f0f0f0]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 튜토리얼 컨텐츠 */}
      <div className="page-content">
        <div
          className={`transition-opacity duration-200 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

// 튜토리얼 단계 컴포넌트
function TutorialStep({
  icon,
  headerImage,
  title,
  description,
  highlights,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  showPrev = true,
  nextLabel = '다음',
  nextDisabled = false,
}: {
  icon?: string;
  headerImage?: string;
  title: string;
  description: string;
  highlights: string[];
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  showPrev?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="max-w-lg mx-auto">
      {/* 아이콘 또는 이미지 */}
      <div className="text-center mb-6">
        {headerImage ? (
          <img
            src={headerImage}
            alt={title}
            className="w-40 h-40 mx-auto mb-4 object-contain"
          />
        ) : (
          <div className="text-6xl mb-4">{icon}</div>
        )}
        <div className="text-sm font-medium text-text-tertiary mb-2">
          {stepNumber}/{totalSteps}
        </div>
      </div>

      {/* 제목 & 설명 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-3 text-center">{title}</h1>
        <p className="text-base text-text-secondary text-center">{description}</p>
      </div>

      {/* 하이라이트 카드 */}
      <Card variant="outlined" className="mb-8">
        <div className="space-y-3">
          {highlights.map((highlight, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
              <p className="text-base text-text-primary flex-1">{highlight}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3">
        {showPrev && (
          <button
            onClick={onPrev}
            className="flex-1 h-14 bg-surface text-text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            이전
          </button>
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className={`h-14 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            showPrev ? 'flex-1' : 'w-full'
          }`}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
