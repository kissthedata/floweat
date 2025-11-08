/**
 * Google Vision API 서비스
 */

export interface DetectedFood {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 이미지에서 음식을 감지합니다 (Google Vision API)
 */
export async function detectFoods(imageBase64: string): Promise<DetectedFood[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    console.warn('Google Vision API key not found');
    return [];
  }

  // Data URL에서 순수 base64만 추출 (data:image/jpeg;base64, 제거)
  const base64Content = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Content,
              },
              features: [
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 10,
                },
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Vision API error:', data);
      return [];
    }

    if (data.responses && data.responses[0]) {
      const result = data.responses[0];
      const detectedFoods: DetectedFood[] = [];

      // Object Localization 결과 처리
      if (result.localizedObjectAnnotations) {
        result.localizedObjectAnnotations.forEach((obj: any) => {
          if (isFoodRelated(obj.name)) {
            const vertices = obj.boundingPoly.normalizedVertices;
            detectedFoods.push({
              name: translateToKorean(obj.name),
              confidence: obj.score,
              boundingBox: {
                x: vertices[0].x,
                y: vertices[0].y,
                width: vertices[2].x - vertices[0].x,
                height: vertices[2].y - vertices[0].y,
              },
            });
          }
        });
      }

      // Label Detection 결과 처리 (바운딩 박스 없음)
      if (result.labelAnnotations && detectedFoods.length === 0) {
        result.labelAnnotations
          .filter((label: any) => isFoodRelated(label.description))
          .slice(0, 5)
          .forEach((label: any) => {
            detectedFoods.push({
              name: translateToKorean(label.description),
              confidence: label.score,
            });
          });
      }

      return detectedFoods;
    }

    return [];
  } catch (error) {
    console.error('Google Vision API error:', error);
    return [];
  }
}

/**
 * 음식 관련 객체인지 확인
 */
function isFoodRelated(label: string): boolean {
  const foodKeywords = [
    'food',
    'dish',
    'meal',
    'cuisine',
    'rice',
    'meat',
    'vegetable',
    'soup',
    'salad',
    'fruit',
    'bread',
    'noodle',
    'pasta',
    'pizza',
    'burger',
    'sandwich',
    'dessert',
    'cake',
    'chicken',
    'fish',
    'beef',
    'pork',
  ];

  const lowerLabel = label.toLowerCase();
  return foodKeywords.some((keyword) => lowerLabel.includes(keyword));
}

/**
 * 영어를 한국어로 번역 (간단한 매핑)
 */
function translateToKorean(englishName: string): string {
  const translations: Record<string, string> = {
    food: '음식',
    dish: '요리',
    meal: '식사',
    rice: '밥',
    meat: '고기',
    vegetable: '야채',
    soup: '국',
    salad: '샐러드',
    fruit: '과일',
    bread: '빵',
    noodle: '면',
    pasta: '파스타',
    pizza: '피자',
    burger: '버거',
    sandwich: '샌드위치',
    dessert: '디저트',
    cake: '케이크',
    chicken: '치킨',
    fish: '생선',
    beef: '소고기',
    pork: '돼지고기',
    kimchi: '김치',
    bulgogi: '불고기',
    bibimbap: '비빔밥',
    tteokbokki: '떡볶이',
  };

  const lower = englishName.toLowerCase();
  return translations[lower] || englishName;
}
