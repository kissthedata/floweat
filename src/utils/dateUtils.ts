import type { CalendarDate, MonthData } from '../types';

/**
 * 해당 월의 모든 날짜 데이터를 생성합니다 (이전/다음 달 포함)
 */
export function generateMonthDates(year: number, month: number): CalendarDate[] {
  const dates: CalendarDate[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 해당 월의 첫날과 마지막날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 첫 주의 시작 요일 (일요일 = 0)
  const firstDayOfWeek = firstDay.getDay();

  // 이전 달 날짜 채우기
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    dates.push({
      date,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      meals: [],
    });
  }

  // 현재 달 날짜
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    dates.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      meals: [],
    });
  }

  // 다음 달 날짜 채우기 (6주 고정)
  const remainingDays = 42 - dates.length; // 7일 * 6주 = 42일
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    dates.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      meals: [],
    });
  }

  return dates;
}

/**
 * 월 데이터를 생성합니다
 */
export function generateMonthData(year: number, month: number): MonthData {
  return {
    year,
    month,
    dates: generateMonthDates(year, month),
  };
}

/**
 * 날짜를 한국어 형식으로 포맷팅합니다
 */
export function formatDate(date: Date, format: 'full' | 'short' | 'day' = 'full'): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (format === 'full') {
    return `${year}년 ${month}월 ${day}일`;
  } else if (format === 'short') {
    return `${month}월 ${day}일`;
  } else {
    return `${day}`;
  }
}

/**
 * 월을 한국어 형식으로 포맷팅합니다
 */
export function formatMonth(year: number, month: number): string {
  return `${year}년 ${month + 1}월`;
}

/**
 * 요일 이름을 반환합니다
 */
export function getDayName(dayIndex: number): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[dayIndex];
}

/**
 * 두 날짜가 같은 날인지 확인합니다
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환합니다
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환합니다
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 이전 달로 이동
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) {
    return { year: year - 1, month: 11 };
  }
  return { year, month: month - 1 };
}

/**
 * 다음 달로 이동
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) {
    return { year: year + 1, month: 0 };
  }
  return { year, month: month + 1 };
}
