import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common';
import { supabase } from '../lib/supabase';

interface SurveyAnswers {
  q0?: number; // 먹는 순서 건강 영향 인지도 (1-5)
  q1?: number; // 순서 추천 도움 정도 (1-5)
  q2?: number; // 음식 구성 인식 정확도 (1-5)
  q3?: number; // 사진→결과 과정 편의성 (1-5)
  q4?: number; // 재사용 의향 (1-5)
  q5?: number; // 설명 이해도 (1-5)
  q6?: number; // 실제 따라먹기 시도 (0-4)
  q7?: number; // NPS 추천 의향 (0-10)
  q8?: number; // 사진 인식 속도 만족도 (1-5)
  q9?: string[]; // 불편했던 점 (다중 선택)
  q9Other?: string; // Q9 기타 입력
  q10?: string[]; // 재사용 상황 (다중 선택)
  q10Other?: string; // Q10 기타 입력
  gender?: string; // 성별
  ageRange?: string; // 연령대
  occupation?: string; // 직업
  wantsNotification?: boolean; // 출시 알림 수신 여부
  contactEmail?: string; // 연락 이메일
  contactPhone?: string; // 연락 전화번호
}

export default function SurveyPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [fadeIn, setFadeIn] = useState(true);
  const [showQ9OtherInput, setShowQ9OtherInput] = useState(false);
  const [showQ10OtherInput, setShowQ10OtherInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = 13; // Q0-Q12
  const progress = ((currentStep + 1) / totalSteps) * 100;

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get current user (if logged in, otherwise null for anonymous)
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare data for database (convert camelCase to snake_case)
      const surveyData = {
        user_id: user?.id || null,
        q0: answers.q0,
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        q4: answers.q4,
        q5: answers.q5,
        q6: answers.q6,
        q7: answers.q7,
        q8: answers.q8,
        q9: answers.q9 || null,
        q9_other: answers.q9Other || null,
        q10: answers.q10 || null,
        q10_other: answers.q10Other || null,
        gender: answers.gender || null,
        age_range: answers.ageRange || null,
        occupation: answers.occupation || null,
        wants_launch_notification: answers.wantsNotification || false,
        contact_email: answers.contactEmail || null,
        contact_phone: answers.contactPhone || null,
      };

      console.log('설문 결과 저장 중:', surveyData);

      // Save to Supabase
      const { data, error } = await supabase
        .from('survey_responses')
        .insert([surveyData])
        .select();

      if (error) {
        console.error('설문 저장 오류:', error);
        setSubmitError('설문 결과를 저장하는 중 오류가 발생했습니다.');
        setIsSubmitting(false);
        return;
      }

      console.log('설문 저장 완료:', data);

      // 성공적으로 저장되면 마지막 단계(감사 메시지)로 이동
      setIsSubmitting(false);
      nextStep();
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      setSubmitError('예상치 못한 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuestionBox
            title="식사에서 '먹는 순서'가"
            subtitle="건강에 영향을 준다는 사실을 알고 있었나요?"
          >
            <ScaleButton
              value={1}
              selected={answers.q0 === 1}
              onClick={() => setAnswers((prev) => ({ ...prev, q0: 1 }))}
            >
              전혀 몰랐다
            </ScaleButton>
            <ScaleButton
              value={2}
              selected={answers.q0 === 2}
              onClick={() => setAnswers((prev) => ({ ...prev, q0: 2 }))}
            >
              잘 몰랐다
            </ScaleButton>
            <ScaleButton
              value={3}
              selected={answers.q0 === 3}
              onClick={() => setAnswers((prev) => ({ ...prev, q0: 3 }))}
            >
              어느 정도 알고 있었다
            </ScaleButton>
            <ScaleButton
              value={4}
              selected={answers.q0 === 4}
              onClick={() => setAnswers((prev) => ({ ...prev, q0: 4 }))}
            >
              알고 있었다
            </ScaleButton>
            <ScaleButton
              value={5}
              selected={answers.q0 === 5}
              onClick={() => setAnswers((prev) => ({ ...prev, q0: 5 }))}
            >
              매우 잘 알고 있었다
            </ScaleButton>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              showPrev={false}
              nextDisabled={!answers.q0}
            />
          </QuestionBox>
        );

      case 1:
        return (
          <QuestionBox
            title="이번 식사에서"
            subtitle="FLOW:EAT의 '먹는 순서 추천'이 얼마나 도움이 되었나요?"
          >
            <ScaleButton
              value={1}
              selected={answers.q1 === 1}
              onClick={() => setAnswers((prev) => ({ ...prev, q1: 1 }))}
            >
              전혀 도움 안 됨
            </ScaleButton>
            <ScaleButton
              value={2}
              selected={answers.q1 === 2}
              onClick={() => setAnswers((prev) => ({ ...prev, q1: 2 }))}
            >
              별로 도움 안 됨
            </ScaleButton>
            <ScaleButton
              value={3}
              selected={answers.q1 === 3}
              onClick={() => setAnswers((prev) => ({ ...prev, q1: 3 }))}
            >
              보통
            </ScaleButton>
            <ScaleButton
              value={4}
              selected={answers.q1 === 4}
              onClick={() => setAnswers((prev) => ({ ...prev, q1: 4 }))}
            >
              도움됨
            </ScaleButton>
            <ScaleButton
              value={5}
              selected={answers.q1 === 5}
              onClick={() => setAnswers((prev) => ({ ...prev, q1: 5 }))}
            >
              매우 도움됨
            </ScaleButton>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.q1}
            />
          </QuestionBox>
        );

      case 2:
        return (
          <QuestionBox
            title="음식 구성 인식"
            subtitle="(채소/단백질/탄수 등)은 얼마나 정확했다고 느끼셨나요?"
          >
            <ScaleButton
              value={1}
              selected={answers.q2 === 1}
              onClick={() => setAnswers((prev) => ({ ...prev, q2: 1 }))}
            >
              매우 부정확
            </ScaleButton>
            <ScaleButton
              value={2}
              selected={answers.q2 === 2}
              onClick={() => setAnswers((prev) => ({ ...prev, q2: 2 }))}
            >
              부정확
            </ScaleButton>
            <ScaleButton
              value={3}
              selected={answers.q2 === 3}
              onClick={() => setAnswers((prev) => ({ ...prev, q2: 3 }))}
            >
              보통
            </ScaleButton>
            <ScaleButton
              value={4}
              selected={answers.q2 === 4}
              onClick={() => setAnswers((prev) => ({ ...prev, q2: 4 }))}
            >
              정확함
            </ScaleButton>
            <ScaleButton
              value={5}
              selected={answers.q2 === 5}
              onClick={() => setAnswers((prev) => ({ ...prev, q2: 5 }))}
            >
              매우 정확함
            </ScaleButton>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.q2}
            />
          </QuestionBox>
        );

      case 3:
        return (
          <QuestionBox
            title="Q3. 사진 찍기 후 결과 보기"
            subtitle="과정은 얼마나 편했나요?"
          >
            <ScaleButton
              value={1}
              selected={answers.q3 === 1}
              onClick={() => setAnswers((prev) => ({ ...prev, q3: 1 }))}
            >
              매우 불편
            </ScaleButton>
            <ScaleButton
              value={2}
              selected={answers.q3 === 2}
              onClick={() => setAnswers((prev) => ({ ...prev, q3: 2 }))}
            >
              불편
            </ScaleButton>
            <ScaleButton
              value={3}
              selected={answers.q3 === 3}
              onClick={() => setAnswers((prev) => ({ ...prev, q3: 3 }))}
            >
              보통
            </ScaleButton>
            <ScaleButton
              value={4}
              selected={answers.q3 === 4}
              onClick={() => setAnswers((prev) => ({ ...prev, q3: 4 }))}
            >
              편함
            </ScaleButton>
            <ScaleButton
              value={5}
              selected={answers.q3 === 5}
              onClick={() => setAnswers((prev) => ({ ...prev, q3: 5 }))}
            >
              매우 편함
            </ScaleButton>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.q3}
            />
          </QuestionBox>
        );

      case 4:
        return (
          <QuestionBox
            title="FLOW:EAT을"
            subtitle="다음 식사에서 다시 사용할 의향이 있나요?"
          >
            <ScaleButton
              value={1}
              selected={answers.q4 === 1}
              onClick={() => setAnswers((prev) => ({ ...prev, q4: 1 }))}
            >
              없음
            </ScaleButton>
            <ScaleButton
              value={2}
              selected={answers.q4 === 2}
              onClick={() => setAnswers((prev) => ({ ...prev, q4: 2 }))}
            >
              별로 없음
            </ScaleButton>
            <ScaleButton
              value={3}
              selected={answers.q4 === 3}
              onClick={() => setAnswers((prev) => ({ ...prev, q4: 3 }))}
            >
              모르겠다
            </ScaleButton>
            <ScaleButton
              value={4}
              selected={answers.q4 === 4}
              onClick={() => setAnswers((prev) => ({ ...prev, q4: 4 }))}
            >
              있음
            </ScaleButton>
            <ScaleButton
              value={5}
              selected={answers.q4 === 5}
              onClick={() => setAnswers((prev) => ({ ...prev, q4: 5 }))}
            >
              매우 있음
            </ScaleButton>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.q4}
            />
          </QuestionBox>
        );

      case 5:
        return (
          <QuestionBox
            title="순서 추천 카드의 설명은"
            subtitle="이해하기 쉬웠나요?"
          >
            <ScaleButton
              value={1}
              selected={answers.q5 === 1}
              onClick={() => setAnswers((prev) => ({ ...prev, q5: 1 }))}
            >
              매우 어려움
            </ScaleButton>
            <ScaleButton
              value={2}
              selected={answers.q5 === 2}
              onClick={() => setAnswers((prev) => ({ ...prev, q5: 2 }))}
            >
              조금 어려움
            </ScaleButton>
            <ScaleButton
              value={3}
              selected={answers.q5 === 3}
              onClick={() => setAnswers((prev) => ({ ...prev, q5: 3 }))}
            >
              보통
            </ScaleButton>
            <ScaleButton
              value={4}
              selected={answers.q5 === 4}
              onClick={() => setAnswers((prev) => ({ ...prev, q5: 4 }))}
            >
              쉬움
            </ScaleButton>
            <ScaleButton
              value={5}
              selected={answers.q5 === 5}
              onClick={() => setAnswers((prev) => ({ ...prev, q5: 5 }))}
            >
              매우 쉬움
            </ScaleButton>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.q5}
            />
          </QuestionBox>
        );

      case 6:
        return (
          <QuestionBox
            title="이번 식사에서 FLOW:EAT이"
            subtitle="추천한 순서를 실제로 따라 먹으려고 시도했나요?"
          >
            <ScaleButton
              value={0}
              selected={answers.q6 === 0}
              onClick={() => setAnswers((prev) => ({ ...prev, q6: 0 }))}
            >
              아직 식사 시간이 아니었음 (테스트만 했음)
            </ScaleButton>
            <ScaleButton
              value={1}
              selected={answers.q6 === 1}
              onClick={() => setAnswers((prev) => ({ ...prev, q6: 1 }))}
            >
              전혀 안 함
            </ScaleButton>
            <ScaleButton
              value={2}
              selected={answers.q6 === 2}
              onClick={() => setAnswers((prev) => ({ ...prev, q6: 2 }))}
            >
              일부 시도함
            </ScaleButton>
            <ScaleButton
              value={3}
              selected={answers.q6 === 3}
              onClick={() => setAnswers((prev) => ({ ...prev, q6: 3 }))}
            >
              대부분 시도함
            </ScaleButton>
            <ScaleButton
              value={4}
              selected={answers.q6 === 4}
              onClick={() => setAnswers((prev) => ({ ...prev, q6: 4 }))}
            >
              완전히 그 순서대로 먹음
            </ScaleButton>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={answers.q6 === undefined}
            />
          </QuestionBox>
        );

      case 7:
        return (
          <QuestionBox
            title="FLOW:EAT을 친구/가족에게"
            subtitle="추천할 의향이 있나요? (NPS)"
          >
            <div className="grid grid-cols-6 gap-2 mb-4">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers((prev) => ({ ...prev, q7: i }))}
                  className={`h-14 rounded-xl font-semibold transition-all ${
                    answers.q7 === i
                      ? 'bg-green-500 text-white scale-110'
                      : 'bg-surface text-text-primary hover:bg-gray-100'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-tertiary text-center mb-4">
              0점: 전혀 추천 안함 → 10점: 적극 추천
            </p>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={answers.q7 === undefined}
            />
          </QuestionBox>
        );

      case 8:
        return (
          <QuestionBox
            title="사진 인식 속도"
            subtitle="(결과 뜨는 속도)에 얼마나 만족하시나요?"
          >
            <ScaleButton
              value={1}
              selected={answers.q8 === 1}
              onClick={() => setAnswers((prev) => ({ ...prev, q8: 1 }))}
            >
              매우 느림
            </ScaleButton>
            <ScaleButton
              value={2}
              selected={answers.q8 === 2}
              onClick={() => setAnswers((prev) => ({ ...prev, q8: 2 }))}
            >
              느림
            </ScaleButton>
            <ScaleButton
              value={3}
              selected={answers.q8 === 3}
              onClick={() => setAnswers((prev) => ({ ...prev, q8: 3 }))}
            >
              보통
            </ScaleButton>
            <ScaleButton
              value={4}
              selected={answers.q8 === 4}
              onClick={() => setAnswers((prev) => ({ ...prev, q8: 4 }))}
            >
              빠름
            </ScaleButton>
            <ScaleButton
              value={5}
              selected={answers.q8 === 5}
              onClick={() => setAnswers((prev) => ({ ...prev, q8: 5 }))}
            >
              매우 빠름
            </ScaleButton>
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.q8}
            />
          </QuestionBox>
        );

      case 9:
        return (
          <QuestionBox
            title="FLOW:EAT 사용 중"
            subtitle="불편했던 점이 있다면 선택해주세요 (중복 선택 가능)"
          >
            <CheckboxButton
              checked={answers.q9?.includes('사진 인식 정확도') || false}
              onClick={() => {
                const current = answers.q9 || [];
                const newValue = current.includes('사진 인식 정확도')
                  ? current.filter((v) => v !== '사진 인식 정확도')
                  : [...current, '사진 인식 정확도'];
                setAnswers((prev) => ({ ...prev, q9: newValue }));
              }}
            >
              사진 인식 정확도
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q9?.includes('결과 로딩 시간') || false}
              onClick={() => {
                const current = answers.q9 || [];
                const newValue = current.includes('결과 로딩 시간')
                  ? current.filter((v) => v !== '결과 로딩 시간')
                  : [...current, '결과 로딩 시간'];
                setAnswers((prev) => ({ ...prev, q9: newValue }));
              }}
            >
              결과 로딩 시간
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q9?.includes('순서 추천이 와닿지 않음') || false}
              onClick={() => {
                const current = answers.q9 || [];
                const newValue = current.includes('순서 추천이 와닿지 않음')
                  ? current.filter((v) => v !== '순서 추천이 와닿지 않음')
                  : [...current, '순서 추천이 와닿지 않음'];
                setAnswers((prev) => ({ ...prev, q9: newValue }));
              }}
            >
              순서 추천이 와닿지 않음
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q9?.includes('설명 부족') || false}
              onClick={() => {
                const current = answers.q9 || [];
                const newValue = current.includes('설명 부족')
                  ? current.filter((v) => v !== '설명 부족')
                  : [...current, '설명 부족'];
                setAnswers((prev) => ({ ...prev, q9: newValue }));
              }}
            >
              설명 부족
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q9?.includes('UI/UX 불편') || false}
              onClick={() => {
                const current = answers.q9 || [];
                const newValue = current.includes('UI/UX 불편')
                  ? current.filter((v) => v !== 'UI/UX 불편')
                  : [...current, 'UI/UX 불편'];
                setAnswers((prev) => ({ ...prev, q9: newValue }));
              }}
            >
              UI/UX 불편
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q9?.includes('사용 흐름 헷갈림') || false}
              onClick={() => {
                const current = answers.q9 || [];
                const newValue = current.includes('사용 흐름 헷갈림')
                  ? current.filter((v) => v !== '사용 흐름 헷갈림')
                  : [...current, '사용 흐름 헷갈림'];
                setAnswers((prev) => ({ ...prev, q9: newValue }));
              }}
            >
              사용 흐름 헷갈림
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q9?.includes('특별한 문제 없음') || false}
              onClick={() => {
                const current = answers.q9 || [];
                const newValue = current.includes('특별한 문제 없음')
                  ? current.filter((v) => v !== '특별한 문제 없음')
                  : [...current, '특별한 문제 없음'];
                setAnswers((prev) => ({ ...prev, q9: newValue }));
              }}
            >
              특별한 문제 없음
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q9?.includes('기타') || false}
              onClick={() => {
                const current = answers.q9 || [];
                const isChecked = current.includes('기타');
                const newValue = isChecked
                  ? current.filter((v) => v !== '기타')
                  : [...current, '기타'];
                setAnswers((prev) => ({ ...prev, q9: newValue }));
                setShowQ9OtherInput(!isChecked);
                if (isChecked) {
                  setAnswers((prev) => ({ ...prev, q9Other: '' }));
                }
              }}
            >
              기타
            </CheckboxButton>
            {showQ9OtherInput && (
              <textarea
                value={answers.q9Other || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, q9Other: e.target.value }))}
                placeholder="구체적으로 작성해주세요"
                className="w-full h-24 p-4 border-2 border-border rounded-xl resize-none focus:border-primary focus:outline-none text-text-primary mt-2"
              />
            )}
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.q9 || answers.q9.length === 0}
            />
          </QuestionBox>
        );

      case 10:
        return (
          <QuestionBox
            title="FLOW:EAT을"
            subtitle="어떤 상황에서 다시 사용할 것 같나요? (복수선택 가능)"
          >
            <CheckboxButton
              checked={answers.q10?.includes('출근/직장 점심') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const newValue = current.includes('출근/직장 점심')
                  ? current.filter((v) => v !== '출근/직장 점심')
                  : [...current, '출근/직장 점심'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
              }}
            >
              출근/직장 점심
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q10?.includes('학교·공부 중 식사') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const newValue = current.includes('학교·공부 중 식사')
                  ? current.filter((v) => v !== '학교·공부 중 식사')
                  : [...current, '학교·공부 중 식사'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
              }}
            >
              학교·공부 중 식사
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q10?.includes('외식/식당') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const newValue = current.includes('외식/식당')
                  ? current.filter((v) => v !== '외식/식당')
                  : [...current, '외식/식당'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
              }}
            >
              외식/식당
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q10?.includes('다이어트 중일 때') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const newValue = current.includes('다이어트 중일 때')
                  ? current.filter((v) => v !== '다이어트 중일 때')
                  : [...current, '다이어트 중일 때'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
              }}
            >
              다이어트 중일 때
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q10?.includes('소화·가스·더부룩함 있을 때') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const newValue = current.includes('소화·가스·더부룩함 있을 때')
                  ? current.filter((v) => v !== '소화·가스·더부룩함 있을 때')
                  : [...current, '소화·가스·더부룩함 있을 때'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
              }}
            >
              소화·가스·더부룩함 있을 때
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q10?.includes('늦은 밤 식사') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const newValue = current.includes('늦은 밤 식사')
                  ? current.filter((v) => v !== '늦은 밤 식사')
                  : [...current, '늦은 밤 식사'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
              }}
            >
              늦은 밤 식사
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q10?.includes('아무 때나') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const newValue = current.includes('아무 때나')
                  ? current.filter((v) => v !== '아무 때나')
                  : [...current, '아무 때나'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
              }}
            >
              아무 때나
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q10?.includes('다시 사용할 것 같지 않음') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const newValue = current.includes('다시 사용할 것 같지 않음')
                  ? current.filter((v) => v !== '다시 사용할 것 같지 않음')
                  : [...current, '다시 사용할 것 같지 않음'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
              }}
            >
              다시 사용할 것 같지 않음
            </CheckboxButton>
            <CheckboxButton
              checked={answers.q10?.includes('기타') || false}
              onClick={() => {
                const current = answers.q10 || [];
                const isChecked = current.includes('기타');
                const newValue = isChecked
                  ? current.filter((v) => v !== '기타')
                  : [...current, '기타'];
                setAnswers((prev) => ({ ...prev, q10: newValue }));
                setShowQ10OtherInput(!isChecked);
                if (isChecked) {
                  setAnswers((prev) => ({ ...prev, q10Other: '' }));
                }
              }}
            >
              기타
            </CheckboxButton>
            {showQ10OtherInput && (
              <textarea
                value={answers.q10Other || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, q10Other: e.target.value }))}
                placeholder="구체적으로 작성해주세요"
                className="w-full h-24 p-4 border-2 border-border rounded-xl resize-none focus:border-primary focus:outline-none text-text-primary mt-2"
              />
            )}
            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.q10 || answers.q10.length === 0}
            />
          </QuestionBox>
        );

      case 11:
        return (
          <QuestionBox
            title="마지막으로 간단한 정보를"
            subtitle="알려주세요"
          >
            <div className="space-y-6">
              {/* 성별 */}
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3">성별</h3>
                <div className="grid grid-cols-2 gap-2">
                  <CompactRadioButton
                    selected={answers.gender === '남성'}
                    onClick={() => setAnswers((prev) => ({ ...prev, gender: '남성' }))}
                  >
                    남성
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.gender === '여성'}
                    onClick={() => setAnswers((prev) => ({ ...prev, gender: '여성' }))}
                  >
                    여성
                  </CompactRadioButton>
                </div>
              </div>

              {/* 연령대 */}
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3">연령대</h3>
                <div className="grid grid-cols-3 gap-2">
                  <CompactRadioButton
                    selected={answers.ageRange === '10대'}
                    onClick={() => setAnswers((prev) => ({ ...prev, ageRange: '10대' }))}
                  >
                    10대
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.ageRange === '20대'}
                    onClick={() => setAnswers((prev) => ({ ...prev, ageRange: '20대' }))}
                  >
                    20대
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.ageRange === '30대'}
                    onClick={() => setAnswers((prev) => ({ ...prev, ageRange: '30대' }))}
                  >
                    30대
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.ageRange === '40대'}
                    onClick={() => setAnswers((prev) => ({ ...prev, ageRange: '40대' }))}
                  >
                    40대
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.ageRange === '50대'}
                    onClick={() => setAnswers((prev) => ({ ...prev, ageRange: '50대' }))}
                  >
                    50대
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.ageRange === '60대 이상'}
                    onClick={() => setAnswers((prev) => ({ ...prev, ageRange: '60대 이상' }))}
                  >
                    60대 이상
                  </CompactRadioButton>
                </div>
              </div>

              {/* 직업 */}
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3">직업</h3>
                <div className="grid grid-cols-2 gap-2">
                  <CompactRadioButton
                    selected={answers.occupation === '학생'}
                    onClick={() => setAnswers((prev) => ({ ...prev, occupation: '학생' }))}
                  >
                    학생
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.occupation === '직장인'}
                    onClick={() => setAnswers((prev) => ({ ...prev, occupation: '직장인' }))}
                  >
                    직장인
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.occupation === '자영업'}
                    onClick={() => setAnswers((prev) => ({ ...prev, occupation: '자영업' }))}
                  >
                    자영업
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.occupation === '전문직'}
                    onClick={() => setAnswers((prev) => ({ ...prev, occupation: '전문직' }))}
                  >
                    전문직
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.occupation === '주부'}
                    onClick={() => setAnswers((prev) => ({ ...prev, occupation: '주부' }))}
                  >
                    주부
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.occupation === '무직'}
                    onClick={() => setAnswers((prev) => ({ ...prev, occupation: '무직' }))}
                  >
                    무직
                  </CompactRadioButton>
                  <CompactRadioButton
                    selected={answers.occupation === '기타'}
                    onClick={() => setAnswers((prev) => ({ ...prev, occupation: '기타' }))}
                  >
                    기타
                  </CompactRadioButton>
                </div>
              </div>
            </div>

            <NavigationButtons
              onNext={nextStep}
              onPrev={prevStep}
              nextDisabled={!answers.gender || !answers.ageRange || !answers.occupation}
            />
          </QuestionBox>
        );

      case 12:
        return (
          <QuestionBox
            title="플로잇이 정식 출시한다면"
            subtitle="알림을 받고 싶으신가요?"
          >
            <div className="space-y-4">
              <CheckboxButton
                checked={answers.wantsNotification || false}
                onClick={() => {
                  const newValue = !answers.wantsNotification;
                  setAnswers((prev) => ({ ...prev, wantsNotification: newValue }));
                  if (!newValue) {
                    // 체크 해제 시 연락처 정보 초기화
                    setAnswers((prev) => ({ ...prev, contactEmail: '', contactPhone: '' }));
                  }
                }}
              >
                네, 출시 소식을 받고 싶어요
              </CheckboxButton>

              {answers.wantsNotification && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      이메일 <span className="text-red-600">(둘 중 하나 필수)</span>
                    </label>
                    <input
                      type="email"
                      value={answers.contactEmail || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="example@email.com"
                      className="w-full h-12 px-4 border-2 border-border rounded-xl focus:border-primary focus:outline-none text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      전화번호 <span className="text-red-600">(둘 중 하나 필수)</span>
                    </label>
                    <input
                      type="tel"
                      value={answers.contactPhone || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="010-0000-0000"
                      className="w-full h-12 px-4 border-2 border-border rounded-xl focus:border-primary focus:outline-none text-text-primary"
                    />
                  </div>
                  {answers.wantsNotification &&
                   !answers.contactEmail?.trim() &&
                   !answers.contactPhone?.trim() && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-red-600 flex-shrink-0">⚠️</span>
                      <p className="text-sm text-red-600 font-medium">
                        이메일 또는 전화번호 중 하나를 입력해주세요
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <NavigationButtons
              onNext={handleSubmit}
              onPrev={prevStep}
              nextDisabled={
                isSubmitting ||
                (answers.wantsNotification &&
                 !answers.contactEmail?.trim() &&
                 !answers.contactPhone?.trim())
              }
              nextLabel={isSubmitting ? '저장 중...' : '제출'}
            />
          </QuestionBox>
        );

      case 13:
        return (
          <div className="max-w-lg mx-auto text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">✓</div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">
                설문 감사합니다!
              </h1>
              <p className="text-base text-text-secondary">
                소중한 의견 감사드립니다.
                <br />
                더 나은 FLOW:EAT이 되겠습니다.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full h-14 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      {/* 헤더 & 진행률 바 */}
      <div className="page-header">
        <div className="flex items-center justify-end mb-2 px-4">
          {currentStep < 11 && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center hover:opacity-70 transition-opacity"
            >
              <img
                src="/components/arrow_back.png"
                alt="나가기"
                className="h-6 w-6"
              />
            </button>
          )}
        </div>
        {currentStep < 11 && (
          <div className="px-4 mb-4">
            <div className="flex gap-1 justify-center">
              {[...Array(totalSteps)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= currentStep ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
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

// 척도 버튼 컴포넌트 (1-5점)
function ScaleButton({
  value,
  children,
  onClick,
  selected,
}: {
  value: number;
  children: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-14 font-medium rounded-xl transition-all active:scale-95 text-left px-5 ${
        selected
          ? 'bg-green-500 text-white'
          : 'bg-surface text-text-primary hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

// 선택 버튼 컴포넌트 (Q10용)
function OptionButton({
  children,
  onClick,
  selected,
}: {
  children: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-14 font-semibold rounded-xl transition-all active:scale-95 ${
        selected
          ? 'bg-green-500 text-white'
          : 'bg-surface text-text-primary hover:bg-gray-100'
      }`}
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
          ? 'bg-green-500 text-white'
          : 'bg-surface text-text-primary hover:bg-gray-100'
      }`}
    >
      <span>{children}</span>
      <span className="text-xl">{checked ? '✓' : ''}</span>
    </button>
  );
}

// 컴팩트 라디오 버튼 컴포넌트 (인구통계용)
function CompactRadioButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-4 text-sm font-medium rounded-lg transition-all active:scale-95 ${
        selected
          ? 'bg-green-500 text-white'
          : 'bg-surface text-text-primary hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

// 네비게이션 버튼 컴포넌트
function NavigationButtons({
  onNext,
  onPrev,
  showPrev = true,
  nextDisabled,
  nextLabel = '다음',
}: {
  onNext: () => void;
  onPrev: () => void;
  showPrev?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-3 mt-6">
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
  );
}
