/**
 * 튜토리얼 완료 상태 관리 (sessionStorage 사용)
 * 브라우저 세션 동안만 유지되며, 탭을 닫으면 초기화됩니다.
 */

const TUTORIAL_COMPLETED_KEY = 'tutorialCompleted';

/**
 * 사용자의 튜토리얼 완료 여부 확인
 */
export async function checkTutorialCompleted(): Promise<boolean> {
  try {
    const completed = sessionStorage.getItem(TUTORIAL_COMPLETED_KEY);
    return completed === 'true';
  } catch (error) {
    console.error('Failed to check tutorial completion:', error);
    return false;
  }
}

/**
 * 튜토리얼 완료 상태로 업데이트
 */
export async function markTutorialCompleted(): Promise<void> {
  try {
    sessionStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  } catch (error) {
    console.error('Failed to mark tutorial as completed:', error);
    throw error;
  }
}

/**
 * 튜토리얼 완료 상태 초기화 (재시청용)
 */
export async function resetTutorialCompletion(): Promise<void> {
  try {
    sessionStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  } catch (error) {
    console.error('Failed to reset tutorial completion:', error);
    throw error;
  }
}
