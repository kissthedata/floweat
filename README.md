# FLOW:EAT

**먹는 순서를 알려주는 AI + 칼로리 + 식단 기록**

FLOW:EAT은 음식 사진 한 장으로 칼로리·영양 분석 + 최적의 먹는 순서 추천 + 식단 기록까지 한 번에 제공하는 AI 식습관 코치입니다.

## 핵심 기능

### 1. 음식 사진 분석 (Food Detection)
- AI가 자동으로 음식 구성요소를 분류
- 야채/단백질/지방/탄수화물/단순당 카테고리
- 칼로리 + 주요 영양소 자동 계산

### 2. 먹는 순서 추천 (Order Guide)
사진 분석 + 사용자 목표에 따라 최적의 먹는 순서 제공:
- **소화 편안함**: 소화가 편한 순서
- **포만감 유지**: 오래 지속되는 포만감
- **졸림 방지**: 식후 피로 감소

### 3. 칼로리·영양 정보 자동 계산
- 전체 칼로리, 탄수화물/단백질/지방 비율
- 당, 나트륨 등 상세 영양소
- 입력 없이 자동 계산

### 4. 식단 기록 일지 (Food Diary)
- 사진 + 칼로리 + 순서 자동 저장
- 날짜별 식단 히스토리
- 사용자 피드백 기록

## 사용 흐름

1. **사진 촬영/업로드** → 음식 사진 선택
2. **목표 선택** → 소화/포만감/피로 중 선택
3. **결과 확인** → 먹는 순서 + 영양 정보 제공 + 자동 저장

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Toss-style UI)
- **AI**: OpenAI GPT-4 Vision API
- **Routing**: React Router v6

## 시작하기

### 설치
```bash
npm install
```

### 환경 변수 설정
`.env` 파일 생성:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/     # UI 컴포넌트
├── pages/          # 라우트 페이지
├── services/       # AI API 통합
├── types/          # TypeScript 타입
└── hooks/          # Custom hooks
```

## 디자인 시스템

- **Primary Color**: `#ee58f3` (핑크)
- **Typography**: Pretendard/Apple SD Gothic Neo
- **Style**: Toss-inspired clean UI

## License

MIT
