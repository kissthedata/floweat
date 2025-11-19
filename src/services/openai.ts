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

각 음식에 대해:
1. 영양 효능 설명 (nutritionBenefits): 주요 영양소와 건강 효능을 1-2문장으로
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
      "nutritionBenefits": "비타민C, 식이섬유 풍부 → 소화 촉진, 항산화 효과",
      "nutrition": { "carbs": 7, "protein": 3, "fat": 0.4 }
    },
    {
      "name": "계란후라이",
      "category": "protein",
      "nutritionBenefits": "필수 아미노산, 비타민A 함유 → 근육 생성, 시력 보호",
      "nutrition": { "carbs": 1, "protein": 13, "fat": 11 },
      "warnings": {
        "timing": "밤에 먹으면 소화가 느려질 수 있어요",
        "overconsumption": "콜레스테롤이 높으니 하루 2개 이상은 피하세요"
      }
    }
  ],
  "eatingOrder": {
    "steps": [
      {
        "order": 1,
        "foodName": "브로콜리",
        "description": "소화를 위해 브로콜리를 먼저 드시는 게 좋아요! 식이섬유가 소화를 도와주거든요!"
      },
      {
        "order": 2,
        "foodName": "계란후라이",
        "description": "계란후라이는 단백질이 풍부해서 브로콜리 다음에 먹는 게 좋아요! (케찹과 함께 드세요)"
      }
    ],
    "reason": "이 순서로 먹으면 ${goalDescriptions[goal]} 도움이 됩니다."
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
