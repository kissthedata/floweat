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
    // Mock response for development without API key
    return getMockAnalysis(goal);
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
        model: 'gpt-4-vision-preview',
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
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data: OpenAIVisionResponse = await response.json();
    const content = data.choices[0].message.content;
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
    return getMockAnalysis(goal);
  }
}

// Mock data for development/testing
function getMockAnalysis(goal: EatingGoal): MealAnalysis {
  const goalNames = {
    digestion: '소화 편안',
    satiety: '포만감 유지',
    energy: '졸림 방지',
  };

  return {
    imageUrl: '',
    foods: [
      {
        name: '된장찌개',
        category: 'protein',
        calories: 180,
        nutrition: {
          carbs: 15,
          protein: 12,
          fat: 8,
          sugar: 3,
          sodium: 850,
        },
      },
      {
        name: '백미밥',
        category: 'carbohydrate',
        calories: 300,
        nutrition: {
          carbs: 68,
          protein: 6,
          fat: 1,
          sugar: 0,
          sodium: 0,
        },
      },
      {
        name: '배추김치',
        category: 'vegetable',
        calories: 40,
        nutrition: {
          carbs: 8,
          protein: 2,
          fat: 0,
          sugar: 4,
          sodium: 420,
        },
      },
    ],
    totalCalories: 520,
    totalNutrition: {
      carbs: 91,
      protein: 20,
      fat: 9,
      sugar: 7,
      sodium: 1270,
    },
    eatingOrder: {
      goal,
      goalName: goalNames[goal],
      steps: [
        {
          order: 1,
          category: 'vegetable',
          categoryName: '야채/섬유질',
          description: '김치를 먼저 드세요',
        },
        {
          order: 2,
          category: 'protein',
          categoryName: '단백질',
          description: '된장찌개의 건더기를 드세요',
        },
        {
          order: 3,
          category: 'carbohydrate',
          categoryName: '탄수화물',
          description: '밥은 마지막에 드세요',
        },
      ],
      reason:
        '섬유질과 단백질을 먼저 섭취하면 혈당 상승이 완만해져 포만감이 오래 지속됩니다.',
    },
    timestamp: Date.now(),
  };
}
