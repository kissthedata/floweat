import type { EatingGoal, MealAnalysis, FoodCategory } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface OpenAIVisionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * 1차 분석: 이미지에서 음식 이름만 감지 (Vision API)
 */
export async function detectFoodsFromImage(
  imageBase64: string
): Promise<{ name: string; category: FoodCategory }[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured.');
  }

  const prompt = `이 음식 사진에서 보이는 모든 음식의 이름과 카테고리를 JSON으로 제공하세요.

카테고리: vegetable(야채), protein(단백질), fat(지방), carbohydrate(탄수화물), sugar(당류)

응답 형식:
{
  "foods": [
    { "name": "브로콜리", "category": "vegetable" },
    { "name": "계란후라이", "category": "protein" },
    { "name": "밥", "category": "carbohydrate" }
  ]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' },
        temperature: 0,
        seed: 42,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error details:', errorData);
      throw new Error(`OpenAI API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data: OpenAIVisionResponse = await response.json();
    let content = data.choices[0].message.content;
    content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    console.log('OpenAI food detection response:', content.substring(0, 200) + '...');

    if (!content || content.length === 0) {
      throw new Error('Empty response from OpenAI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON. Full content:', content);
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    return parsed.foods;
  } catch (error) {
    console.error('Error detecting foods:', error);
    throw new Error(`Failed to detect foods: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 2차 분석: 음식 목록으로 영양 정보 + 먹는 순서 생성 (일반 GPT, 이미지 없음)
 */
export async function analyzeNutritionAndOrder(
  foods: { name: string; category: FoodCategory }[],
  goal: EatingGoal
): Promise<Omit<MealAnalysis, 'imageUrl' | 'timestamp'>> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured.');
  }

  const goalDescriptions = {
    digestion: '소화가 편안하도록',
    satiety: '포만감이 오래 유지되도록',
    energy: '식후 졸림과 피로를 방지하도록',
    weight: '혈당 스파이크를 억제하고 체지방 증가를 최소화하도록',
  };

  const goalNames = {
    digestion: '소화 편안',
    satiety: '포만감 유지',
    energy: '졸림 방지',
    weight: '체중 관리',
  };

  const foodList = foods.map(f => `${f.name}(${f.category})`).join(', ');

  const prompt = `다음 음식들의 영양 정보와 먹는 순서를 분석해주세요:
${foodList}

목표: ${goalDescriptions[goal]}

## 1️⃣ 목표별 차별화된 가이드
사용자의 목표는 '${goalDescriptions[goal]}'입니다.
각 단계의 description에서 이 목표에 특화된 과학적 근거를 명시하세요.

**목표별 설명 차별화 예시:**
- 체중 관리: "혈당 스파이크를 억제하여 체지방 축적을 막습니다"
- 졸림 방지: "혈당 급등락을 방지해 식후 졸림을 예방합니다"
- 포만감: "GLP-1 호르몬 분비를 촉진하여 포만감이 오래 지속됩니다"
- 소화: "소화 효소 분비를 준비하여 위장 부담을 줄입니다"

## 2️⃣ 타이밍 가이드 (과학적 근거 기반)

⚠️ 타이머는 정확히 2곳에만 제공하세요:

**1. 채소 → 단백질 전환점: 3-5분**
- 근거: 위장 운동 자극, 소화 준비
- description 예시: "...⏱️ 몇 입 드신 후 타이머를 눌러주세요 (5분 천천히 드세요)"

**2. 단백질 → 탄수화물 전환점: 7-10분 (가장 중요!)**
- 근거: 혈당 스파이크 완화, 인슐린 및 포만감 호르몬 분비 촉진
- description 예시: "...⏱️ 단백질 몇 입 드신 후 타이머를 눌러주세요 (10분 천천히)"

**3. 탄수화물 이후: 타이머 없음**
- 이유: 혈당 조절에 큰 영향 없음

## 3️⃣ 한국 식사 문화 고려
한국은 밥(주식) + 여러 반찬(부식) + 국/찌개를 **동시에** 먹는 문화입니다.
코스 요리처럼 완전히 분리해서 먹는 것은 비현실적입니다.

**현실적인 가이드를 제공하세요:**
✅ 좋은 예:
- "밥 뚜껑 열기 전 채소 반찬을 3번 집어 드세요"
- "김치찌개 속 두부와 고기를 먼저 건져드세요"
- "밥은 나중에, 반찬과 함께 천천히 드세요"
- "국물보다 건더기를 먼저 드세요"

❌ 비현실적:
- "채소만 다 먹고 밥 드세요"
- "단백질을 완전히 소화시킨 후 탄수화물"

**먹는 순서 그룹화:**
⚠️ **중요: 감지된 모든 음식을 빠짐없이 먹는 순서에 포함하세요!**

- 1단계: 채소류 - 감지된 모든 채소를 구체적으로 나열
  - 예: "채소 반찬 (시금치나물, 콩나물, 상추, 오이)" ← 4개 모두 언급

- 2단계: 단백질류 - 감지된 모든 단백질 음식 나열
  - 예: "단백질 반찬 (계란후라이, 두부, 삼겹살)" ← 3개 모두 언급

- 3단계: 탄수화물 + 기타 - 밥, 국/찌개, 남은 반찬 포함
  - 예: "밥 + 김치 + 된장찌개 + 깍두기" ← 모두 언급

**중요:** foodName은 카테고리명으로, description에는 구체적인 음식 이름을 모두 나열하세요.

## 4️⃣ 구체적 음식별 지침
각 음식의 nutritionBenefits에 **액션 가능한 구체적 지침**을 포함하세요:

**예시:**
- "천천히 씹어서 드세요 (최소 20회)"
- "밥공기 절반 정도가 적당합니다"
- "국물보다 건더기를 먼저 드세요"
- "김치는 소화를 도우니 함께 드셔도 좋아요"
- "한 입 크기로 잘라 먹으면 소화가 잘 됩니다"

## 5️⃣ 목표별 식사 가이드 작성
사용자가 선택한 목표 '${goalDescriptions[goal]}'에 대해 **일반인도 쉽게 이해할 수 있으면서도 과학적 근거가 포함된** 식사 가이드를 작성하세요.

**작성 요구사항:**
- 길이: 200-250자
- 난이도: 영양에 잘 모르는 일반인도 충분히 이해할 수 있어야 함
- 내용: 왜 이렇게 먹어야 하는지 과학적 이유를 쉽게 설명
- 톤: 친근하고 격려하는 톤

**과학 용어 사용법:**
- 전문 용어는 쉬운 말로 설명 추가
  - "혈당(피 속의 당분)"
  - "포만감 호르몬(GLP-1)"
  - "인슐린(혈당 조절 호르몬)"
- 은유와 함께 과학 설명
  - "혈당이 롤러코스터처럼 급등락하면..."
  - "위가 준비운동을 하듯 소화 효소를 분비하고..."
  - "마라톤 선수가 에너지를 비축하듯..."

**목표별 작성 예시:**
- 체중 관리: "채소를 먼저 드시면 식이섬유가 위에서 그물망을 만들어요. 이 그물망이 나중에 들어오는 당분의 흡수 속도를 늦춰서 혈당(피 속의 당분)이 급격히 오르는 것을 막아줍니다. 혈당이 롤러코스터처럼 급등락하면 인슐린(혈당 조절 호르몬)이 과도하게 분비되어 체지방이 쌓이기 쉬워요."

- 졸림 방지: "채소→단백질→탄수화물 순서로 드시면 혈당이 완만하게 올라갑니다. 혈당이 급격히 오르면 인슐린이 과하게 나와 1-2시간 후 혈당이 뚝 떨어지면서 졸음과 피로가 몰려와요. 단백질을 먼저 드시면 포만감 호르몬이 미리 분비되어 탄수화물 섭취량도 자연스럽게 줄어듭니다."

- 포만감 유지: "단백질을 먼저 충분히 드시면 GLP-1이라는 포만감 호르몬이 분비됩니다. 이 호르몬은 위 배출 속도를 늦춰서 배고픔이 천천히 오게 만들어요. 또한 채소의 식이섬유는 위에서 부피를 키워 물리적인 포만감을 주고, 장에서 오래 머물러 배고픔을 지연시킵니다."

- 소화 편안: "채소를 먼저 드시면 위가 준비운동을 하듯 소화 효소를 분비하기 시작해요. 이 상태에서 단백질과 탄수화물이 들어오면 소화가 훨씬 수월합니다. 또한 식이섬유는 장 운동을 촉진해 음식물이 장을 부드럽게 통과하도록 도와 더부룩함을 예방합니다."

각 음식에 대해:
1. 영양 효능 설명 (nutritionBenefits): 주요 영양소 + 구체적 먹는 팁 (2-3문장)
2. 영양 성분 (nutrition): 탄수화물, 단백질, 지방만 (g 단위)
3. 주의사항 (warnings): 해당되는 경우에만 포함
   - timing: 섭취 시간대 주의 (예: "밤에는 소화 부담이 될 수 있어요")
   - overconsumption: 과다섭취 주의 (예: "하루 2개 이상은 피하세요")
   - general: 일반 주의사항 (예: "익혀서 드세요", "알레르기 주의")
4. 먹는 순서: 구체적인 음식 이름으로 제공

**중요 지침:**
- 결합된 음식(예: 계란후라이+케찹)은 주재료 기준으로 순서를 결정하고, 설명(description)에 부재료를 언급하세요
- 전체 식사의 영양 균형을 분석하여 nutritionAnalysis에 1-2문장으로 친근하고 유익한 코멘트를 제공하세요

다음 JSON 형식으로 응답해주세요:
{
  "foods": [
    {
      "name": "브로콜리",
      "category": "vegetable",
      "nutritionBenefits": "비타민C, 식이섬유 풍부 → 소화 촉진, 항산화 효과. 천천히 씹어서 드세요 (최소 20회).",
      "nutrition": { "carbs": 7, "protein": 3, "fat": 0.4 }
    },
    {
      "name": "계란후라이",
      "category": "protein",
      "nutritionBenefits": "필수 아미노산, 비타민A 함유 → 근육 생성, 시력 보호. 케찹과 함께 드시면 비타민C가 철분 흡수를 도와줍니다.",
      "nutrition": { "carbs": 1, "protein": 13, "fat": 11 },
      "warnings": {
        "timing": "밤에 먹으면 소화가 느려질 수 있어요",
        "overconsumption": "콜레스테롤이 높으니 하루 2개 이상은 피하세요"
      }
    },
    {
      "name": "밥",
      "category": "carbohydrate",
      "nutritionBenefits": "에너지원인 탄수화물 제공. 밥공기 절반 정도가 적당하며, 반찬과 함께 천천히 드세요.",
      "nutrition": { "carbs": 50, "protein": 4, "fat": 0.5 }
    }
  ],
  "eatingOrder": {
    "steps": [
      {
        "order": 1,
        "foodName": "채소 반찬",
        "description": "브로콜리, 샐러드를 먼저 드세요. 식이섬유가 소화 효소 분비를 준비합니다. ⏱️ 5분 정도 천천히 씹어주세요 (위장 준비 시간)"
      },
      {
        "order": 2,
        "foodName": "단백질 반찬",
        "description": "계란후라이를 드세요. 단백질이 포만감 호르몬을 자극합니다. ⏱️ 10분 정도 기다려주세요 (혈당 조절 핵심 구간)"
      },
      {
        "order": 3,
        "foodName": "밥",
        "description": "이제 밥을 천천히 드세요. 밥공기 절반 정도가 적당합니다."
      }
    ],
    "reason": "이 순서로 먹으면 ${goalDescriptions[goal]} 도움이 됩니다.",
    "eatingGuide": "채소를 먼저 드시면 식이섬유가 위에서 그물망을 만들어요. 이 그물망이 나중에 들어오는 당분의 흡수 속도를 늦춰서 혈당(피 속의 당분)이 급격히 오르는 것을 막아줍니다. 혈당이 롤러코스터처럼 급등락하면 인슐린(혈당 조절 호르몬)이 과도하게 분비되어 체지방이 쌓이기 쉬워요."
  },
  "nutritionAnalysis": "이 식사는 탄수화물 비중이 높아 에너지 공급에 좋지만, 단백질을 조금 더 섭취하면 균형잡힌 식사가 될 것 같아요!"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        temperature: 0,
        seed: 42,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error details:', errorData);
      throw new Error(`OpenAI API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data: OpenAIVisionResponse = await response.json();
    let content = data.choices[0].message.content;
    content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    // 응답 내용 로깅 (디버깅용)
    console.log('OpenAI nutrition analysis response:', content.substring(0, 200) + '...');

    // JSON 파싱 전 응답 완전성 검증
    if (!content || content.length === 0) {
      throw new Error('Empty response from OpenAI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON. Full content:', content);
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    // Calculate total nutrition (탄단지만)
    const totalNutrition = parsed.foods.reduce(
      (acc: any, food: any) => ({
        carbs: acc.carbs + food.nutrition.carbs,
        protein: acc.protein + food.nutrition.protein,
        fat: acc.fat + food.nutrition.fat,
      }),
      { carbs: 0, protein: 0, fat: 0 }
    );

    return {
      foods: parsed.foods,
      totalNutrition,
      eatingOrder: {
        goal,
        goalName: goalNames[goal],
        steps: parsed.eatingOrder.steps,
        reason: parsed.eatingOrder.reason,
        eatingGuide: parsed.eatingOrder.eatingGuide,
      },
      nutritionAnalysis: parsed.nutritionAnalysis,
    };
  } catch (error) {
    console.error('Error analyzing nutrition:', error);
    throw new Error(`Failed to analyze nutrition: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeFoodImage(
  imageBase64: string,
  goal: EatingGoal
): Promise<MealAnalysis> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  const goalDescriptions = {
    digestion: '소화가 편안하도록',
    satiety: '포만감이 오래 유지되도록',
    energy: '식후 졸림과 피로를 방지하도록',
    weight: '혈당 스파이크를 억제하고 체지방 증가를 최소화하도록',
  };

  const prompt = `당신은 영양 전문가입니다. 이 음식 사진을 분석하여 다음 정보를 JSON 형식으로 제공해주세요:

1. 음식 목록 (foods): 각 음식의 이름, 카테고리, 주요 영양소 및 건강 효능, 영양 성분
2. 먹는 순서 (eatingOrder): ${goalDescriptions[goal]} 최적의 먹는 순서를 단계별로 제공
3. 이유 (reason): 왜 이 순서로 먹어야 하는지 1-2문장으로 설명

주의사항:
- 음식의 개수나 양(그램)은 추정하지 마세요. 전체 식사 대비 영양 성분 비율만 계산하세요.
- nutritionBenefits는 각 음식의 주요 영양소와 건강 효능을 1-2문장으로 설명하세요.
- 모든 영양 성분(탄수화물, 단백질, 지방, 당, 나트륨, 식이섬유, 콜레스테롤)을 반드시 포함하세요.

응답 형식:
{
  "foods": [
    {
      "name": "음식명",
      "category": "vegetable|protein|fat|carbohydrate|sugar",
      "nutritionBenefits": "비타민C, 식이섬유 풍부 → 소화 촉진, 항산화 효과",
      "nutrition": {
        "carbs": 숫자(g),
        "protein": 숫자(g),
        "fat": 숫자(g),
        "sugar": 숫자(g),
        "sodium": 숫자(mg),
        "fiber": 숫자(g),
        "cholesterol": 숫자(mg)
      }
    }
  ],
  "eatingOrder": {
    "steps": [
      {
        "order": 1,
        "category": "vegetable",
        "categoryName": "야채/섬유질",
        "description": "먼저 드세요"
      }
    ],
    "reason": "이유 설명"
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        temperature: 0,
        seed: 42,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error details:', errorData);
      throw new Error(`OpenAI API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data: OpenAIVisionResponse = await response.json();
    let content = data.choices[0].message.content;

    // Remove markdown code blocks if present (```json ... ```)
    content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    console.log('OpenAI food image analysis response:', content.substring(0, 200) + '...');

    if (!content || content.length === 0) {
      throw new Error('Empty response from OpenAI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON. Full content:', content);
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    // Calculate total nutrition
    const totalNutrition = parsed.foods.reduce(
      (acc: any, food: any) => ({
        carbs: acc.carbs + food.nutrition.carbs,
        protein: acc.protein + food.nutrition.protein,
        fat: acc.fat + food.nutrition.fat,
        sugar: acc.sugar + food.nutrition.sugar,
        sodium: acc.sodium + food.nutrition.sodium,
        fiber: acc.fiber + food.nutrition.fiber,
        cholesterol: acc.cholesterol + food.nutrition.cholesterol,
      }),
      { carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0, cholesterol: 0 }
    );

    const goalNames = {
      digestion: '소화 편안',
      satiety: '포만감 유지',
      energy: '졸림 방지',
      weight: '체중 관리',
    };

    return {
      imageUrl: imageBase64,
      foods: parsed.foods,
      totalNutrition,
      eatingOrder: {
        goal,
        goalName: goalNames[goal],
        steps: parsed.eatingOrder.steps,
        reason: parsed.eatingOrder.reason,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error analyzing food image:', error);
    throw new Error(`Failed to analyze food image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
