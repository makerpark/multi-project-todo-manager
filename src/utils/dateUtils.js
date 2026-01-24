import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  isWeekend,
  isSameDay,
  parseISO
} from 'date-fns';
import { ko } from 'date-fns/locale/ko';

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export const formatDate = (date) => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * 날짜를 표시용 형식으로 포맷
 */
export const formatDisplayDate = (date) => {
  return format(date, 'M월 d일 (EEE)', { locale: ko });
};

/**
 * 주간 날짜 배열 가져오기 (월요일 시작)
 */
export const getWeekDays = (date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // 월요일 시작
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

/**
 * 월간 날짜 배열 가져오기 (캘린더 그리드용)
 */
export const getMonthDays = (date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const monthStart = startOfWeek(start, { weekStartsOn: 1 });
  const monthEnd = endOfWeek(end, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: monthStart, end: monthEnd });
};

/**
 * 작업 가능한 날짜인지 확인 (주말/공휴일 제외)
 */
export const isWorkDay = (date, settings = {}) => {
  const { workDays = [1, 2, 3, 4, 5], holidays = [], excludedDates = [] } = settings;

  const dateStr = formatDate(date);
  const dayOfWeek = date.getDay();

  // 제외된 날짜 확인
  if (excludedDates.includes(dateStr)) return false;

  // 공휴일 확인
  if (holidays.includes(dateStr)) return false;

  // 작업 요일 확인
  return workDays.includes(dayOfWeek);
};

/**
 * 시작일부터 종료일까지 작업 가능한 날짜들 가져오기
 */
export const getWorkDays = (startDate, endDate, settings) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => isWorkDay(day, settings));
};

/**
 * 다음 작업 가능한 날짜 찾기
 */
export const getNextWorkDay = (date, settings) => {
  let nextDay = addDays(date, 1);
  let attempts = 0;
  const maxAttempts = 365; // 무한 루프 방지

  while (!isWorkDay(nextDay, settings) && attempts < maxAttempts) {
    nextDay = addDays(nextDay, 1);
    attempts++;
  }

  return nextDay;
};

/**
 * 루틴 반복 날짜 계산
 */
export const calculateRoutineDates = (routine, startDate, endDate) => {
  const dates = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const routineStart = parseISO(routine.startDate);

  let currentDate = start > routineStart ? start : routineStart;

  switch (routine.type) {
    case 'daily':
      // 매일 반복
      while (currentDate <= end) {
        dates.push(formatDate(currentDate));
        currentDate = addDays(currentDate, routine.frequency || 1);
      }
      break;

    case 'weekly':
      // 주간 반복 (특정 요일)
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (routine.weekDays && routine.weekDays.includes(dayOfWeek)) {
          dates.push(formatDate(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }
      break;

    case 'monthly':
      // 월간 반복 (특정 일)
      while (currentDate <= end) {
        if (currentDate.getDate() === routine.dayOfMonth) {
          dates.push(formatDate(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }
      break;

    case 'yearly':
      // 년간 반복 (특정 월/일)
      while (currentDate <= end) {
        if (
          currentDate.getMonth() + 1 === routine.month &&
          currentDate.getDate() === routine.dayOfMonth
        ) {
          dates.push(formatDate(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }
      break;

    default:
      break;
  }

  // 루틴 종료일이 있으면 필터링
  if (routine.endDate) {
    const routineEnd = parseISO(routine.endDate);
    return dates.filter(date => parseISO(date) <= routineEnd);
  }

  return dates;
};

/**
 * 오늘 날짜 확인
 */
export const isToday = (date) => {
  return isSameDay(date, new Date());
};

/**
 * 날짜 문자열을 Date 객체로 변환
 */
export const parseDate = (dateStr) => {
  return parseISO(dateStr);
};
