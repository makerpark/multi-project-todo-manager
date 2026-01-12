/**
 * 멀티 프로젝트 할 일 관리 - 유틸리티 함수
 * Copyright (c) 2025 Park Yong Jae
 * Licensed under MIT License
 */

/**
 * 로컬 스토리지에서 프로젝트 데이터를 불러옵니다
 * @returns {Array} 프로젝트 배열
 */
export const loadProjects = () => {
  try {
    const saved = localStorage.getItem('projectTaskManager');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error);
  }
  // 기본 데이터
  return [
    {
      id: 1,
      name: '프로젝트 A',
      color: 'bg-blue-500',
      startDate: '',
      endDate: '',
      completed: false,
      tasks: [
        { id: 1, text: '회의 자료 준비', completed: false, dueDate: '' },
        { id: 2, text: '클라이언트 피드백 반영', completed: false, dueDate: '' }
      ]
    },
    {
      id: 2,
      name: '프로젝트 B',
      color: 'bg-purple-500',
      startDate: '',
      endDate: '',
      completed: false,
      tasks: [
        { id: 3, text: '디자인 시안 검토', completed: false, dueDate: '' },
        { id: 4, text: '개발 일정 조율', completed: false, dueDate: '' }
      ]
    }
  ];
};

/**
 * 로컬 스토리지에서 설정을 불러옵니다
 * @returns {Object} 설정 객체
 */
export const loadSettings = () => {
  try {
    const saved = localStorage.getItem('projectTaskSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('설정 로드 실패:', error);
  }
  return { fontSize: 'medium' };
};

/**
 * 마감일이 지났는지 확인합니다
 * @param {string} dueDate - 마감일 (YYYY-MM-DD 형식)
 * @returns {boolean} 마감일이 지났으면 true
 */
export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

/**
 * 날짜를 한국어 형식으로 포맷합니다
 * @param {string} dateString - 날짜 문자열
 * @returns {string} 포맷된 날짜 (예: "12월 25일")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

/**
 * 프로젝트 목록에서 할 일 통계를 계산합니다
 * @param {Array} projects - 프로젝트 배열
 * @returns {Object} 완료된 할 일과 전체 할 일 개수
 */
export const getTodayStats = (projects) => {
  const activeProjects = projects.filter(p => !p.completed);
  const allTasks = activeProjects.flatMap(p => p.tasks);
  const completed = allTasks.filter(t => t.completed).length;
  const total = allTasks.length;
  return { completed, total };
};

/**
 * 프로젝트를 정렬합니다 (완료되지 않은 프로젝트를 먼저 표시, 마감일 순)
 * @param {Array} projects - 프로젝트 배열
 * @returns {Array} 정렬된 프로젝트 배열
 */
export const sortProjects = (projects) => {
  return [...projects].sort((a, b) => {
    // 완료된 프로젝트는 뒤로
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    if (a.completed && b.completed) return 0;

    // 마감일이 없는 프로젝트는 뒤로
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;

    // 마감일 순으로 정렬
    return new Date(a.endDate) - new Date(b.endDate);
  });
};

/**
 * 프로젝트 내 할 일을 정렬합니다 (마감일 순)
 * @param {Array} tasks - 할 일 배열
 * @returns {Array} 정렬된 할 일 배열
 */
export const sortTasks = (tasks) => {
  return [...tasks].sort((a, b) => {
    // 마감일이 없는 할 일은 뒤로
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    // 마감일 순으로 정렬
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
};

/**
 * 프로젝트의 진행률을 계산합니다
 * @param {Object} project - 프로젝트 객체
 * @returns {number} 진행률 (0-100)
 */
export const calculateProjectProgress = (project) => {
  if (!project.tasks || project.tasks.length === 0) return 0;
  const completedTasks = project.tasks.filter(t => t.completed).length;
  return Math.round((completedTasks / project.tasks.length) * 100);
};

/**
 * 날짜 문자열이 유효한지 검증합니다
 * @param {string} dateString - 날짜 문자열
 * @returns {boolean} 유효하면 true
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * 두 날짜 사이의 일수를 계산합니다
 * @param {string} startDate - 시작일
 * @param {string} endDate - 종료일
 * @returns {number} 일수 (음수일 수 있음)
 */
export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다
 * @returns {string} 오늘 날짜
 */
export const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};
