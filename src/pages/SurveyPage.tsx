import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common';

interface SurveyAnswers {
  q1?: string; // 먹는 순서 고민 경험
  q2?: number; // 기능 만족도 (1-5)
  q3?: string; // 재사용 의향
  q4?: number; // NPS (0-10)
  q5?: string[]; // 차별점 인식 (복수선택)
  q6?: string; // 개선사항 (텍스트)
  gender?: string;
  age?: string;
  job?: string;
}

export default function SurveyPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [fadeIn, setFadeIn] = useState(true);

  const totalSteps = 9;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (key: keyof SurveyAnswers, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));

    // 자동 진행 (텍스트 입력 제외)
    if (key !== 'q6') {
      setTimeout(() => {
        nextStep();
      }, 300);
    }
  };

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

  const handleSubmit = () => {
    console.log('설문 결과:', answers);
    alert('설문에 참여해주셔서 감사합니다!');
    navigate('/');
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuestionBox
            title="식사할 때"
            subtitle="'어떤 순서로 먹어야 할지' 고민한 적이 있나요?"
          >
            <OptionButton onClick={() => handleAnswer('q1', '자주')}>
              자주 있다
            </OptionButton>
            <OptionButton onClick={() => handleAnswer('q1', '가끔')}>
              가끔 있다
            </OptionButton>
            <OptionButton onClick={() => handleAnswer('q1', '없다')}>
              없다
            </OptionButton>
          </QuestionBox>
        );

      case 1:
        return (
          <QuestionBox
            title="FLOW:EAT의"
            subtitle="'먹는 순서 추천' 기능이 도움이 되었나요?"
          >
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleAnswer('q2', star)}
                  className={`text-4xl transition-transform hover:scale-110 ${
                    answers.q2 && answers.q2 >= star ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <p className="text-sm text-text-tertiary text-center">별점을 선택해주세요</p>
          </QuestionBox>
        );

      case 2:
        return (
          <QuestionBox
            title="다음 식사 때도"
            subtitle="FLOW:EAT을 사용하실 건가요?"
          >
            <OptionButton onClick={() => handleAnswer('q3', '확실히')}>
              확실히 쓸 것 같다
            </OptionButton>
            <OptionButton onClick={() => handleAnswer('q3', '아마')}>
              아마 쓸 것 같다
            </OptionButton>
            <OptionButton onClick={() => handleAnswer('q3', '모르겠다')}>
              잘 모르겠다
            </OptionButton>
            <OptionButton onClick={() => handleAnswer('q3', '안 쓸 것 같다')}>
              안 쓸 것 같다
            </OptionButton>
          </QuestionBox>
        );

      case 3:
        return (
          <QuestionBox
            title="주변 사람에게"
            subtitle="FLOW:EAT을 추천하시겠어요?"
          >
            <div className="grid grid-cols-6 gap-2 mb-4">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer('q4', i)}
                  className={`h-14 rounded-xl font-semibold transition-all ${
                    answers.q4 === i
                      ? 'bg-primary text-white scale-110'
                      : 'bg-surface text-text-primary hover:bg-gray-100'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-tertiary text-center">
              0점: 전혀 추천 안함 → 10점: 적극 추천
            </p>
          </QuestionBox>
        );

      case 4:
        return (
          <QuestionBox
            title="일반 칼로리 앱과 비교했을 때"
            subtitle="FLOW:EAT의 장점은? (복수선택 가능)"
          >
            <CheckboxButton
              checked={answers.q5?.includes('먹는 순서') || false}
              onClick={() => {
                const current = answers.q5 || [];
                const newValue = current.includes('먹는 순서')
                  ? current.filter((v) => v !== '먹는 순서')
                  : [...current, '먹는 순서'];
                setAnswers((prev) => ({ ...prev, q5: newValue }));
              }}
            >
              먹는 순서 가이드가 새롭다
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q5?.includes('AI 자동') || false}
              onClick={() => {
                const current = answers.q5 || [];
                const newValue = current.includes('AI 자동')
                  ? current.filter((v) => v !== 'AI 자동')
                  : [...current, 'AI 자동'];
                setAnswers((prev) => ({ ...prev, q5: newValue }));
              }}
            >
              AI가 자동으로 분석해줘서 편하다
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q5?.includes('목표별 맞춤') || false}
              onClick={() => {
                const current = answers.q5 || [];
                const newValue = current.includes('목표별 맞춤')
                  ? current.filter((v) => v !== '목표별 맞춤')
                  : [...current, '목표별 맞춤'];
                setAnswers((prev) => ({ ...prev, q5: newValue }));
              }}
            >
              목표별 맞춤 추천이 좋다
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q5?.includes('차이 없음') || false}
              onClick={() => {
                const current = answers.q5 || [];
                const newValue = current.includes('차이 없음')
                  ? current.filter((v) => v !== '차이 없음')
                  : [...current, '차이 없음'];
                setAnswers((prev) => ({ ...prev, q5: newValue }));
              }}
            >
              큰 차이 못느낌
            </CheckboxButton>
            <button
              onClick={nextStep}
              disabled={!answers.q5 || answers.q5.length === 0}
              className="w-full h-14 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-4"
            >
              다음
            </button>
          </QuestionBox>
        );

      case 5:
        return (
          <QuestionBox
            title="어떤 기능이 추가되면"
            subtitle="더 자주 사용할 것 같나요?"
          >
            <textarea
              value={answers.q6 || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, q6: e.target.value }))}
              placeholder="자유롭게 의견을 남겨주세요"
              className="w-full h-32 p-4 border-2 border-border rounded-xl resize-none focus:border-primary focus:outline-none text-text-primary"
            />
            <button
              onClick={nextStep}
              className="w-full h-14 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors mt-4"
            >
              다음
            </button>
          </QuestionBox>
        );

      case 6:
        return (
          <QuestionBox title="성별을 알려주세요" subtitle="(선택사항)">
            <OptionButton onClick={() => handleAnswer('gender', '남성')}>
              남성
            </OptionButton>
            <OptionButton onClick={() => handleAnswer('gender', '여성')}>
              여성
            </OptionButton>
            <OptionButton onClick={() => handleAnswer('gender', '선택 안함')}>
              선택 안함
            </OptionButton>
          </QuestionBox>
        );

      case 7:
        return (
          <QuestionBox title="연령대를 알려주세요" subtitle="(선택사항)">
            <OptionButton onClick={() => handleAnswer('age', '10대')}>10대</OptionButton>
            <OptionButton onClick={() => handleAnswer('age', '20대')}>20대</OptionButton>
            <OptionButton onClick={() => handleAnswer('age', '30대')}>30대</OptionButton>
            <OptionButton onClick={() => handleAnswer('age', '40대')}>40대</OptionButton>
            <OptionButton onClick={() => handleAnswer('age', '50대 이상')}>
              50대 이상
            </OptionButton>
          </QuestionBox>
        );

      case 8:
        return (
          <QuestionBox title="직업을 알려주세요" subtitle="(선택사항)">
            <OptionButton onClick={() => { handleAnswer('job', '학생'); handleSubmit(); }}>
              학생
            </OptionButton>
            <OptionButton onClick={() => { handleAnswer('job', '직장인'); handleSubmit(); }}>
              직장인
            </OptionButton>
            <OptionButton onClick={() => { handleAnswer('job', '자영업'); handleSubmit(); }}>
              자영업
            </OptionButton>
            <OptionButton onClick={() => { handleAnswer('job', '주부'); handleSubmit(); }}>
              주부
            </OptionButton>
            <OptionButton onClick={() => { handleAnswer('job', '기타'); handleSubmit(); }}>
              기타
            </OptionButton>
          </QuestionBox>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      {/* 헤더 & 진행률 바 */}
      <div className="page-header">
        <div className="flex items-center justify-between mb-2 px-4">
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
            >
              <svg
                className="w-6 h-6 text-text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={() => navigate('/')}
            className="text-sm text-text-tertiary hover:text-text-primary"
          >
            나가기
          </button>
        </div>
        <div className="px-4">
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 질문 컨텐츠 */}
      <div className="page-content">
        <div
          className={`transition-opacity duration-200 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        >
          {renderQuestion()}
        </div>
      </div>
    </div>
  );
}

// 질문 박스 컴포넌트
function QuestionBox({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">{title}</h1>
      {subtitle && <p className="text-base text-text-secondary mb-8">{subtitle}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// 선택 버튼 컴포넌트
function OptionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full h-14 bg-surface text-text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95"
    >
      {children}
    </button>
  );
}

// 체크박스 버튼 컴포넌트
function CheckboxButton({
  children,
  checked,
  onClick,
}: {
  children: React.ReactNode;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-14 font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-between px-5 ${
        checked
          ? 'bg-primary text-white'
          : 'bg-surface text-text-primary hover:bg-gray-100'
      }`}
    >
      <span>{children}</span>
      <span className="text-xl">{checked ? '✓' : ''}</span>
    </button>
  );
}
