/**
 * 멀티 프로젝트 할 일 관리 - 유틸리티 함수 테스트
 * Copyright (c) 2025 Park Yong Jae
 * Licensed under MIT License
 */

import {
  loadProjects,
  loadSettings,
  isOverdue,
  formatDate,
  getTodayStats,
  sortProjects,
  sortTasks,
  calculateProjectProgress,
  isValidDate,
  getDaysBetween,
  getTodayString,
} from './utils.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

// Mock console.error to suppress error messages in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('loadProjects', () => {
  it('should return default projects when localStorage is empty', () => {
    const projects = loadProjects();
    expect(projects).toHaveLength(2);
    expect(projects[0].name).toBe('프로젝트 A');
    expect(projects[1].name).toBe('프로젝트 B');
  });

  it('should return saved projects from localStorage', () => {
    const savedProjects = [
      {
        id: 100,
        name: '테스트 프로젝트',
        color: 'bg-green-500',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        completed: false,
        tasks: [],
      },
    ];
    localStorage.setItem('projectTaskManager', JSON.stringify(savedProjects));

    const projects = loadProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('테스트 프로젝트');
    expect(projects[0].id).toBe(100);
  });

  it('should return default projects when localStorage contains invalid JSON', () => {
    localStorage.setItem('projectTaskManager', 'invalid json');

    const projects = loadProjects();
    expect(projects).toHaveLength(2);
    expect(console.error).toHaveBeenCalledWith('데이터 로드 실패:', expect.any(Error));
  });

  it('should handle complex project structures', () => {
    const complexProjects = [
      {
        id: 1,
        name: '복잡한 프로젝트',
        color: 'bg-red-500',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        completed: false,
        tasks: [
          { id: 1, text: '할 일 1', completed: false, dueDate: '2025-06-01' },
          { id: 2, text: '할 일 2', completed: true, dueDate: '2025-05-01' },
        ],
      },
    ];
    localStorage.setItem('projectTaskManager', JSON.stringify(complexProjects));

    const projects = loadProjects();
    expect(projects[0].tasks).toHaveLength(2);
    expect(projects[0].tasks[0].text).toBe('할 일 1');
  });
});

describe('loadSettings', () => {
  it('should return default settings when localStorage is empty', () => {
    const settings = loadSettings();
    expect(settings).toEqual({ fontSize: 'medium' });
  });

  it('should return saved settings from localStorage', () => {
    const savedSettings = { fontSize: 'large' };
    localStorage.setItem('projectTaskSettings', JSON.stringify(savedSettings));

    const settings = loadSettings();
    expect(settings.fontSize).toBe('large');
  });

  it('should return default settings when localStorage contains invalid JSON', () => {
    localStorage.setItem('projectTaskSettings', 'invalid json');

    const settings = loadSettings();
    expect(settings).toEqual({ fontSize: 'medium' });
    expect(console.error).toHaveBeenCalledWith('설정 로드 실패:', expect.any(Error));
  });

  it('should handle additional settings properties', () => {
    const savedSettings = { fontSize: 'small', theme: 'dark', language: 'ko' };
    localStorage.setItem('projectTaskSettings', JSON.stringify(savedSettings));

    const settings = loadSettings();
    expect(settings.fontSize).toBe('small');
    expect(settings.theme).toBe('dark');
    expect(settings.language).toBe('ko');
  });
});

describe('isOverdue', () => {
  beforeEach(() => {
    // Mock today as 2026-01-15
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return false for empty or null dates', () => {
    expect(isOverdue('')).toBe(false);
    expect(isOverdue(null)).toBe(false);
    expect(isOverdue(undefined)).toBe(false);
  });

  it('should return true for past dates', () => {
    expect(isOverdue('2026-01-10')).toBe(true);
    expect(isOverdue('2025-12-31')).toBe(true);
    expect(isOverdue('2020-01-01')).toBe(true);
  });

  it('should return false for today', () => {
    expect(isOverdue('2026-01-15')).toBe(false);
  });

  it('should return false for future dates', () => {
    expect(isOverdue('2026-01-16')).toBe(false);
    expect(isOverdue('2026-12-31')).toBe(false);
    expect(isOverdue('2030-01-01')).toBe(false);
  });

  it('should ignore time component when comparing dates', () => {
    // Even with time components, should only compare dates
    expect(isOverdue('2026-01-14T23:59:59')).toBe(true);
    expect(isOverdue('2026-01-15T00:00:00')).toBe(false);
    expect(isOverdue('2026-01-15T23:59:59')).toBe(false);
  });

  it('should handle various date formats', () => {
    expect(isOverdue('2026-01-10')).toBe(true);
    expect(isOverdue('01/10/2026')).toBe(true);
  });
});

describe('formatDate', () => {
  it('should return empty string for empty or null dates', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('should format dates in Korean locale', () => {
    const formatted = formatDate('2025-12-25');
    expect(formatted).toContain('12');
    expect(formatted).toContain('25');
  });

  it('should handle different date formats', () => {
    const date1 = formatDate('2025-01-01');
    const date2 = formatDate('2025-06-15');
    const date3 = formatDate('2025-12-31');

    expect(date1).toBeTruthy();
    expect(date2).toBeTruthy();
    expect(date3).toBeTruthy();
  });

  it('should format leap year dates correctly', () => {
    const formatted = formatDate('2024-02-29');
    expect(formatted).toContain('2');
    expect(formatted).toContain('29');
  });

  it('should handle ISO date strings', () => {
    const formatted = formatDate('2025-07-04T00:00:00.000Z');
    expect(formatted).toBeTruthy();
  });
});

describe('getTodayStats', () => {
  it('should return zero stats for empty projects array', () => {
    const stats = getTodayStats([]);
    expect(stats).toEqual({ completed: 0, total: 0 });
  });

  it('should count tasks only from active projects', () => {
    const projects = [
      {
        id: 1,
        completed: false,
        tasks: [
          { id: 1, completed: true },
          { id: 2, completed: false },
        ],
      },
      {
        id: 2,
        completed: true, // This project is completed, so tasks shouldn't be counted
        tasks: [
          { id: 3, completed: false },
          { id: 4, completed: false },
        ],
      },
    ];

    const stats = getTodayStats(projects);
    expect(stats).toEqual({ completed: 1, total: 2 });
  });

  it('should handle projects with no tasks', () => {
    const projects = [
      { id: 1, completed: false, tasks: [] },
      { id: 2, completed: false, tasks: [] },
    ];

    const stats = getTodayStats(projects);
    expect(stats).toEqual({ completed: 0, total: 0 });
  });

  it('should correctly count all completed tasks', () => {
    const projects = [
      {
        id: 1,
        completed: false,
        tasks: [
          { id: 1, completed: true },
          { id: 2, completed: true },
          { id: 3, completed: true },
        ],
      },
    ];

    const stats = getTodayStats(projects);
    expect(stats).toEqual({ completed: 3, total: 3 });
  });

  it('should handle mixed completed and incomplete tasks', () => {
    const projects = [
      {
        id: 1,
        completed: false,
        tasks: [
          { id: 1, completed: true },
          { id: 2, completed: false },
          { id: 3, completed: true },
          { id: 4, completed: false },
          { id: 5, completed: true },
        ],
      },
    ];

    const stats = getTodayStats(projects);
    expect(stats).toEqual({ completed: 3, total: 5 });
  });

  it('should handle multiple active projects', () => {
    const projects = [
      {
        id: 1,
        completed: false,
        tasks: [
          { id: 1, completed: true },
          { id: 2, completed: false },
        ],
      },
      {
        id: 2,
        completed: false,
        tasks: [
          { id: 3, completed: true },
          { id: 4, completed: true },
        ],
      },
    ];

    const stats = getTodayStats(projects);
    expect(stats).toEqual({ completed: 3, total: 4 });
  });
});

describe('sortProjects', () => {
  it('should return empty array for empty input', () => {
    const sorted = sortProjects([]);
    expect(sorted).toEqual([]);
  });

  it('should move completed projects to the end', () => {
    const projects = [
      { id: 1, completed: true, endDate: '2025-01-01' },
      { id: 2, completed: false, endDate: '2025-01-02' },
      { id: 3, completed: false, endDate: '2025-01-03' },
    ];

    const sorted = sortProjects(projects);
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1);
  });

  it('should sort active projects by end date', () => {
    const projects = [
      { id: 1, completed: false, endDate: '2025-12-31' },
      { id: 2, completed: false, endDate: '2025-01-01' },
      { id: 3, completed: false, endDate: '2025-06-15' },
    ];

    const sorted = sortProjects(projects);
    expect(sorted[0].id).toBe(2); // 2025-01-01
    expect(sorted[1].id).toBe(3); // 2025-06-15
    expect(sorted[2].id).toBe(1); // 2025-12-31
  });

  it('should place projects without end dates at the end of active projects', () => {
    const projects = [
      { id: 1, completed: false, endDate: '' },
      { id: 2, completed: false, endDate: '2025-06-15' },
      { id: 3, completed: false, endDate: '' },
    ];

    const sorted = sortProjects(projects);
    expect(sorted[0].id).toBe(2);
    expect([1, 3]).toContain(sorted[1].id);
    expect([1, 3]).toContain(sorted[2].id);
  });

  it('should not mutate original array', () => {
    const projects = [
      { id: 1, completed: false, endDate: '2025-12-31' },
      { id: 2, completed: false, endDate: '2025-01-01' },
    ];

    const original = [...projects];
    sortProjects(projects);
    expect(projects).toEqual(original);
  });

  it('should handle mix of completed and active projects with various dates', () => {
    const projects = [
      { id: 1, completed: true, endDate: '2025-01-01' },
      { id: 2, completed: false, endDate: '' },
      { id: 3, completed: false, endDate: '2025-06-15' },
      { id: 4, completed: true, endDate: '' },
      { id: 5, completed: false, endDate: '2025-03-01' },
    ];

    const sorted = sortProjects(projects);
    expect(sorted[0].completed).toBe(false);
    expect(sorted[1].completed).toBe(false);
    expect(sorted[2].completed).toBe(false);
    expect(sorted[3].completed).toBe(true);
    expect(sorted[4].completed).toBe(true);
  });
});

describe('sortTasks', () => {
  it('should return empty array for empty input', () => {
    const sorted = sortTasks([]);
    expect(sorted).toEqual([]);
  });

  it('should sort tasks by due date', () => {
    const tasks = [
      { id: 1, dueDate: '2025-12-31' },
      { id: 2, dueDate: '2025-01-01' },
      { id: 3, dueDate: '2025-06-15' },
    ];

    const sorted = sortTasks(tasks);
    expect(sorted[0].id).toBe(2); // 2025-01-01
    expect(sorted[1].id).toBe(3); // 2025-06-15
    expect(sorted[2].id).toBe(1); // 2025-12-31
  });

  it('should place tasks without due dates at the end', () => {
    const tasks = [
      { id: 1, dueDate: '' },
      { id: 2, dueDate: '2025-06-15' },
      { id: 3, dueDate: '' },
    ];

    const sorted = sortTasks(tasks);
    expect(sorted[0].id).toBe(2);
    expect([1, 3]).toContain(sorted[1].id);
    expect([1, 3]).toContain(sorted[2].id);
  });

  it('should not mutate original array', () => {
    const tasks = [
      { id: 1, dueDate: '2025-12-31' },
      { id: 2, dueDate: '2025-01-01' },
    ];

    const original = [...tasks];
    sortTasks(tasks);
    expect(tasks).toEqual(original);
  });

  it('should handle tasks with same due date', () => {
    const tasks = [
      { id: 1, dueDate: '2025-06-15' },
      { id: 2, dueDate: '2025-06-15' },
      { id: 3, dueDate: '2025-06-15' },
    ];

    const sorted = sortTasks(tasks);
    expect(sorted).toHaveLength(3);
    sorted.forEach((task) => {
      expect(task.dueDate).toBe('2025-06-15');
    });
  });

  it('should handle null and undefined due dates', () => {
    const tasks = [
      { id: 1, dueDate: null },
      { id: 2, dueDate: '2025-06-15' },
      { id: 3, dueDate: undefined },
    ];

    const sorted = sortTasks(tasks);
    expect(sorted[0].id).toBe(2);
  });
});

describe('calculateProjectProgress', () => {
  it('should return 0 for project with no tasks', () => {
    const project = { tasks: [] };
    expect(calculateProjectProgress(project)).toBe(0);
  });

  it('should return 0 when no tasks are completed', () => {
    const project = {
      tasks: [
        { id: 1, completed: false },
        { id: 2, completed: false },
      ],
    };
    expect(calculateProjectProgress(project)).toBe(0);
  });

  it('should return 100 when all tasks are completed', () => {
    const project = {
      tasks: [
        { id: 1, completed: true },
        { id: 2, completed: true },
      ],
    };
    expect(calculateProjectProgress(project)).toBe(100);
  });

  it('should calculate percentage correctly', () => {
    const project = {
      tasks: [
        { id: 1, completed: true },
        { id: 2, completed: false },
        { id: 3, completed: false },
        { id: 4, completed: false },
      ],
    };
    expect(calculateProjectProgress(project)).toBe(25);
  });

  it('should round to nearest integer', () => {
    const project = {
      tasks: [
        { id: 1, completed: true },
        { id: 2, completed: false },
        { id: 3, completed: false },
      ],
    };
    // 1/3 = 33.333... should round to 33
    expect(calculateProjectProgress(project)).toBe(33);
  });

  it('should handle project without tasks property', () => {
    const project = {};
    expect(calculateProjectProgress(project)).toBe(0);
  });

  it('should handle project with null tasks', () => {
    const project = { tasks: null };
    expect(calculateProjectProgress(project)).toBe(0);
  });

  it('should calculate for large number of tasks', () => {
    const tasks = Array(100)
      .fill(null)
      .map((_, i) => ({ id: i, completed: i < 50 }));
    const project = { tasks };
    expect(calculateProjectProgress(project)).toBe(50);
  });
});

describe('isValidDate', () => {
  it('should return false for empty or null values', () => {
    expect(isValidDate('')).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
  });

  it('should return true for valid date strings', () => {
    expect(isValidDate('2025-01-01')).toBe(true);
    expect(isValidDate('2025-12-31')).toBe(true);
    expect(isValidDate('2024-02-29')).toBe(true); // Leap year
  });

  it('should return false for invalid date strings', () => {
    expect(isValidDate('invalid')).toBe(false);
    expect(isValidDate('not a date')).toBe(false);
    expect(isValidDate('abc-def-ghi')).toBe(false);
  });

  it('should handle ISO date format', () => {
    expect(isValidDate('2025-01-01T00:00:00.000Z')).toBe(true);
  });

  it('should handle various date formats', () => {
    expect(isValidDate('01/01/2025')).toBe(true);
    expect(isValidDate('2025-01-01')).toBe(true);
  });
});

describe('getDaysBetween', () => {
  it('should return 0 for empty dates', () => {
    expect(getDaysBetween('', '')).toBe(0);
    expect(getDaysBetween('2025-01-01', '')).toBe(0);
    expect(getDaysBetween('', '2025-01-01')).toBe(0);
  });

  it('should calculate days between two dates', () => {
    expect(getDaysBetween('2025-01-01', '2025-01-10')).toBe(9);
    expect(getDaysBetween('2025-01-01', '2025-01-31')).toBe(30);
  });

  it('should return negative days if end date is before start date', () => {
    expect(getDaysBetween('2025-01-10', '2025-01-01')).toBe(-9);
  });

  it('should return 0 for same dates', () => {
    expect(getDaysBetween('2025-01-01', '2025-01-01')).toBe(0);
  });

  it('should handle dates across months', () => {
    expect(getDaysBetween('2025-01-31', '2025-02-01')).toBe(1);
    expect(getDaysBetween('2025-01-01', '2025-02-01')).toBe(31);
  });

  it('should handle dates across years', () => {
    expect(getDaysBetween('2024-12-31', '2025-01-01')).toBe(1);
    expect(getDaysBetween('2024-01-01', '2025-01-01')).toBe(366); // 2024 is a leap year
  });

  it('should handle leap year correctly', () => {
    expect(getDaysBetween('2024-02-28', '2024-03-01')).toBe(2); // Leap year
    expect(getDaysBetween('2025-02-28', '2025-03-01')).toBe(1); // Not a leap year
  });
});

describe('getTodayString', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return today date in YYYY-MM-DD format', () => {
    jest.setSystemTime(new Date('2026-01-15T12:00:00'));
    const today = getTodayString();
    expect(today).toBe('2026-01-15');
  });

  it('should pad single digit months and days with zeros', () => {
    jest.setSystemTime(new Date('2026-01-05T12:00:00'));
    const today = getTodayString();
    expect(today).toBe('2026-01-05');
  });

  it('should work for different dates throughout the year', () => {
    jest.setSystemTime(new Date('2026-12-31T23:59:59'));
    const today = getTodayString();
    expect(today).toBe('2026-12-31');
  });

  it('should ignore time component', () => {
    jest.setSystemTime(new Date('2026-06-15T00:00:00'));
    const morning = getTodayString();

    jest.setSystemTime(new Date('2026-06-15T23:59:59'));
    const evening = getTodayString();

    expect(morning).toBe(evening);
    expect(morning).toBe('2026-06-15');
  });
});
