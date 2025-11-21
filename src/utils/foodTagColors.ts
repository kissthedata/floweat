/**
 * 음식명 태그 색상 팔레트 유틸리티
 * 음식 이름별로 일관된 파스텔톤 색상 할당
 */

export interface TagColor {
  bg: string;      // 배경 색상
  text: string;    // 텍스트 색상
  border: string;  // 테두리 색상
}

// 파스텔톤 색상 팔레트 (8가지)
export const TAG_COLOR_PALETTE: TagColor[] = [
  // 연두
  { bg: '#d4fdc8', text: '#3bc91e', border: '#9fe88d' },
  // 하늘
  { bg: '#cfe7ff', text: '#1d7dd6', border: '#8ec5f5' },
  // 핑크
  { bg: '#ffd6e8', text: '#d6376e', border: '#ffaac9' },
  // 노랑
  { bg: '#fff4cc', text: '#d69c00', border: '#ffe799' },
  // 보라
  { bg: '#e8d6ff', text: '#8c48d6', border: '#d0b3ff' },
  // 주황
  { bg: '#ffe4cc', text: '#d67a1d', border: '#ffcf99' },
  // 민트
  { bg: '#ccfff4', text: '#00d6a3', border: '#99ffe8' },
  // 코랄
  { bg: '#ffd9cc', text: '#d65e1d', border: '#ffb899' },
];

/**
 * 문자열 해시 함수 (간단한 해시)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 음식 이름에 일관된 색상 할당
 * 같은 음식 이름은 항상 같은 색상을 가짐
 */
export function getFoodTagColor(foodName: string): TagColor {
  const index = hashString(foodName) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}
