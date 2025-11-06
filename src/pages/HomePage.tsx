import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="page-content">
        <h1 className="text-[26px] font-bold text-text-primary mb-8 leading-[1.4]">
          어떤 음식을 드세요?
          <br />
          플로잇이 순서를 알려드릴게요!
        </h1>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <Card
            variant="default"
            padding="lg"
            clickable
            onClick={() => navigate('/camera')}
            className="aspect-square"
          >
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <img
                src="/icons/camera-3d.png"
                alt="사진 촬영"
                className="w-[100px] h-[100px] object-contain"
              />
              <p className="text-lg font-medium text-text-primary text-center">
                사진 촬영하기
              </p>
            </div>
          </Card>

          <Card
            variant="default"
            padding="lg"
            clickable
            onClick={() => navigate('/camera')}
            className="aspect-square"
          >
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <img
                src="/icons/gallery-3d.png"
                alt="갤러리"
                className="w-[100px] h-[100px] object-contain"
              />
              <p className="text-lg font-medium text-text-primary text-center">
                갤러리에서 선택
              </p>
            </div>
          </Card>
        </div>

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
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-text-primary">
                    된장찌개 정식
                  </h3>
                  <p className="text-sm text-text-tertiary mt-1">
                    520kcal · 2시간 전
                  </p>
                </div>
                <div className="w-16 h-16 bg-surface rounded-lg"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
