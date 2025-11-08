import type { EatingGoal, MealAnalysis } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface OpenAIVisionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
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
  };

  const prompt = `당신은 영양 전문가입니다. 이 음식 사진을 분석하여 다음 정보를 JSON 형식으로 제공해주세요:

1. 음식 목록 (foods): 각 음식의 이름, 카테고리(vegetable/protein/fat/carbohydrate/sugar), 예상 칼로리, 영양소(탄수화물/단백질/지방/당/나트륨)
2. 먹는 순서 (eatingOrder): ${goalDescriptions[goal]} 최적의 먹는 순서를 단계별로 제공
3. 이유 (reason): 왜 이 순서로 먹어야 하는지 1-2문장으로 설명

응답 형식:
{
  "foods": [
    {
      "name": "음식명",
      "category": "vegetable|protein|fat|carbohydrate|sugar",
      "calories": 숫자,
      "nutrition": {
        "carbs": 숫자(g),
        "protein": 숫자(g),
        "fat": 숫자(g),
        "sugar": 숫자(g),
        "sodium": 숫자(mg)
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
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data: OpenAIVisionResponse = await response.json();
    let content = data.choices[0].message.content;

    // Remove markdown code blocks if present (```json ... ```)
    content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    const parsed = JSON.parse(content);

    // Calculate total nutrition
    const totalNutrition = parsed.foods.reduce(
      (acc: any, food: any) => ({
        carbs: acc.carbs + food.nutrition.carbs,
        protein: acc.protein + food.nutrition.protein,
        fat: acc.fat + food.nutrition.fat,
        sugar: acc.sugar + food.nutrition.sugar,
        sodium: acc.sodium + food.nutrition.sodium,
      }),
      { carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0 }
    );

    const totalCalories = parsed.foods.reduce(
      (sum: number, food: any) => sum + food.calories,
      0
    );

    const goalNames = {
      digestion: '소화 편안',
      satiety: '포만감 유지',
      energy: '졸림 방지',
    };

    return {
      imageUrl: imageBase64,
      foods: parsed.foods,
      totalCalories,
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
