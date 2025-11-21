/**
 * 먹는 순서 설명에서 인식된 음식명을 찾아 하이라이트 처리
 */

import type { FoodItem } from '../types';

export interface TextPart {
  text: string;
  isFood: boolean;
  foodName?: string; // 매칭된 음식 이름 (색상 할당용)
}

/**
 * 한글 조사 제거
 * 예: "샐러드를" -> "샐러드", "오이와" -> "오이"
 */
function removeKoreanParticles(text: string): string {
  // 일반적인 한글 조사 패턴
  const particles = ['을', '를', '이', '가', '은', '는', '와', '과', '에', '의', '으로', '로'];

  for (const particle of particles) {
    if (text.endsWith(particle)) {
      return text.slice(0, -particle.length);
    }
  }

  return text;
}

/**
 * 설명 텍스트에서 인식된 음식명 찾기
 */
export function highlightRecognizedFoods(
  description: string,
  recognizedFoods: FoodItem[]
): TextPart[] {
  if (!description || recognizedFoods.length === 0) {
    return [{ text: description, isFood: false }];
  }

  // 인식된 음식 이름 배열 추출
  const foodNames = recognizedFoods.map(food => food.name);

  // 정규식 패턴 생성: 음식 이름들을 OR로 연결
  // 긴 이름부터 매칭하도록 정렬 (예: "계란후라이"가 "계란"보다 먼저)
  const sortedFoodNames = [...foodNames].sort((a, b) => b.length - a.length);

  // 이스케이프 처리 및 조사 고려 패턴
  const escapedNames = sortedFoodNames.map(name =>
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  // 음식 이름 + 선택적 조사 패턴
  const pattern = new RegExp(
    `(${escapedNames.join('|')})(을|를|이|가|은|는|와|과|에|의|으로|로)?`,
    'g'
  );

  const parts: TextPart[] = [];
  let lastIndex = 0;

  // 정규식으로 매칭되는 모든 음식 이름 찾기
  let match;
  while ((match = pattern.exec(description)) !== null) {
    const matchStart = match.index;
    const matchEnd = pattern.lastIndex;
    const foodName = match[1];  // 음식 이름만
    const particle = match[2];  // 조사 (있을 수도, 없을 수도)

    // 매칭 전 일반 텍스트 추가
    if (matchStart > lastIndex) {
      parts.push({
        text: description.slice(lastIndex, matchStart),
        isFood: false
      });
    }

    // 음식 이름 태그 추가 (조사 제외)
    parts.push({
      text: foodName,
      isFood: true,
      foodName: foodName
    });

    // 조사가 있으면 일반 텍스트로 추가
    if (particle) {
      parts.push({
        text: particle,
        isFood: false
      });
    }

    lastIndex = matchEnd;
  }

  // 남은 텍스트 추가
  if (lastIndex < description.length) {
    parts.push({
      text: description.slice(lastIndex),
      isFood: false
    });
  }

  return parts;
}
