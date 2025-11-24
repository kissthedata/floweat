import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function WalkingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMinutes = location.state?.minutes || 15;
  const goal = location.state?.goal;
  const imageUrl = location.state?.imageUrl;
  const finalAnalysis = location.state?.finalAnalysis;
  const detectedFoods = location.state?.detectedFoods;
  const phase = location.state?.phase;
  const isSaved = location.state?.isSaved;

  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // 초 단위
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // 타이머 로직
  useEffect(() => {
    if (!isRunning || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // 시간 포맷 (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 계산
  const progress = ((initialMinutes * 60 - timeLeft) / (initialMinutes * 60)) * 100;

  // 뒤로가기
  const handleGoBack = () => {
    if (isRunning) {
      setShowExitModal(true);
    } else {
      navigate(-1);
    }
  };

  // 종료 확인
  const handleExit = () => {
    navigate('/result', {
      state: { goal, imageUrl, finalAnalysis, detectedFoods, phase, isSaved },
      replace: true
    });
  };

  // 완료 후 돌아가기
  const handleComplete = () => {
    navigate('/result', {
      state: { goal, imageUrl, finalAnalysis, detectedFoods, phase, isSaved },
      replace: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-light flex flex-col animate-fade-in">
      {/* 헤더 */}
      <div className="page-header">
        <button
          onClick={handleGoBack}
          className="flex items-center justify-center transition-transform hover:scale-110"
        >
          <img
            src="/components/arrow_back.png"
            alt="뒤로가기"
            className="w-6 h-6"
          />
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {/* 상태 텍스트 */}
        <div className="mb-8 transition-opacity duration-300">
          {isCompleted ? (
            <h2 className="text-lg font-medium text-primary animate-pulse">
              고생했어요! 🎉
            </h2>
          ) : isRunning ? (
            <h2 className="text-lg font-medium text-text-secondary animate-fade-in">
              걷는 중...
            </h2>
          ) : (
            <h2 className="text-lg font-medium text-text-secondary">
              준비되셨나요?
            </h2>
          )}
        </div>

        {/* 타이머 (큰 숫자) */}
        <div className="mb-12 transition-all duration-300">
          <div className="text-7xl font-bold text-text-primary tabular-nums tracking-tight">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* 중앙 이미지 영역 */}
        <div className="mb-12 relative">
          {/* 배경 원 (맥박 효과) */}
          <div
            className={`absolute inset-0 bg-primary/10 rounded-full blur-xl ${
              isRunning ? 'animate-pulse' : ''
            }`}
            style={{ width: '280px', height: '280px', margin: '-40px' }}
          />

          {/* 이미지 placeholder */}
          <div
            className={`relative w-52 h-52 rounded-full bg-gradient-to-br from-primary-light to-primary/20 flex items-center justify-center overflow-hidden shadow-lg transition-transform duration-1000 ${
              isRunning ? 'animate-pulse-slow' : ''
            }`}
          >
            {/* 사용자가 나중에 이미지 추가할 자리 */}
            <div className="text-6xl">🚶‍♂️</div>
          </div>

          {/* 원형 진행 바 */}
          {isRunning && (
            <svg
              className="absolute top-0 left-0 w-52 h-52 -rotate-90"
              viewBox="0 0 208 208"
            >
              <circle
                cx="104"
                cy="104"
                r="100"
                stroke="#d4fdc8"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="104"
                cy="104"
                r="100"
                stroke="#4ae523"
                strokeWidth="4"
                fill="none"
                strokeDasharray={628.32}
                strokeDashoffset={628.32 * (1 - progress / 100)}
                className="transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* 설명 텍스트 */}
        <div className="text-center mb-8 transition-opacity duration-500">
          <p className="text-base text-text-secondary leading-relaxed">
            {isCompleted
              ? '멋져요! 혈당 관리에 도움이 되었습니다'
              : '혈당 조절을 위해 가볍게 걸어보세요'}
          </p>
          {!isCompleted && (
            <p className="text-sm text-text-tertiary mt-2">
              💡 식후 걷기는 혈당 스파이크를 완화합니다
            </p>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="page-bottom bg-transparent">
        {isCompleted ? (
          <button
            onClick={handleComplete}
            className="w-full h-14 bg-primary text-white rounded-xl font-semibold text-lg transition-all hover:bg-primary-dark hover:scale-105 active:scale-95"
          >
            완료
          </button>
        ) : (
          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
                className="flex-1 h-14 bg-primary text-white rounded-xl font-semibold text-lg transition-all hover:bg-primary-dark hover:scale-105 active:scale-95"
              >
                시작하기
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="flex-1 h-14 bg-surface text-text-primary rounded-xl font-semibold border-2 border-border transition-all hover:bg-gray-100 hover:scale-105 active:scale-95"
              >
                일시정지
              </button>
            )}
            <button
              onClick={() => setShowExitModal(true)}
              className="flex-1 h-14 bg-surface text-text-secondary rounded-xl font-medium border-2 border-border transition-all hover:bg-gray-100 hover:scale-105 active:scale-95"
            >
              종료하기
            </button>
          </div>
        )}
      </div>

      {/* 종료 확인 모달 */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 animate-scale-up">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              걷기를 종료하시겠어요?
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              진행 중인 타이머가 초기화됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 bg-surface text-text-primary rounded-xl font-medium transition-colors hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold transition-colors hover:bg-red-600"
              >
                종료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-up {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
