import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  distributeProjectTasks,
  generateTaskId,
  generateProjectId,
  generateRoutineId
} from '../utils/taskUtils';

const SchedulerContext = createContext();

export const useScheduler = () => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error('useScheduler must be used within SchedulerProvider');
  }
  return context;
};

const STORAGE_KEY = 'protodo_scheduler_data';

export const SchedulerProvider = ({ children }) => {
  const loadData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }

    // 기본 데이터
    return {
      projects: [],
      freeTasks: [],
      routines: [],
      settings: {
        workDays: [1, 2, 3, 4, 5], // 월~금
        holidays: [],
        excludedDates: []
      }
    };
  };

  const [data, setData] = useState(loadData);
  const [currentView, setCurrentView] = useState('week'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());

  // 데이터 변경 시 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('데이터 저장 실패:', error);
    }
  }, [data]);

  // 프로젝트 추가
  const addProject = (project) => {
    const newProject = {
      ...project,
      id: generateProjectId(),
      tasks: project.tasks || [],
      createdAt: new Date().toISOString()
    };

    // Task 자동 배정
    if (newProject.startDate && newProject.endDate && newProject.tasks.length > 0) {
      newProject.tasks = distributeProjectTasks(newProject, data.settings);
    }

    setData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));

    return newProject;
  };

  // 프로젝트 수정
  const updateProject = (projectId, updates) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          const updated = { ...p, ...updates };
          // 날짜나 Task가 변경되면 재배정
          if (updates.startDate || updates.endDate || updates.tasks) {
            updated.tasks = distributeProjectTasks(updated, data.settings);
          }
          return updated;
        }
        return p;
      })
    }));
  };

  // 프로젝트 삭제
  const deleteProject = (projectId) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId)
    }));
  };

  // P-Task 추가
  const addProjectTask = (projectId, taskText) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          const newTask = {
            id: generateTaskId(),
            text: taskText,
            projectId,
            completed: false,
            createdAt: new Date().toISOString()
          };

          const updatedProject = {
            ...p,
            tasks: [...p.tasks, newTask]
          };

          // Task 재배정
          updatedProject.tasks = distributeProjectTasks(updatedProject, data.settings);
          return updatedProject;
        }
        return p;
      })
    }));
  };

  // P-Task 완료 토글
  const toggleProjectTask = (projectId, taskId) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: p.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          };
        }
        return p;
      })
    }));
  };

  // P-Task 삭제
  const deleteProjectTask = (projectId, taskId) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          const updatedProject = {
            ...p,
            tasks: p.tasks.filter(t => t.id !== taskId)
          };
          // Task 재배정
          updatedProject.tasks = distributeProjectTasks(updatedProject, data.settings);
          return updatedProject;
        }
        return p;
      })
    }));
  };

  // F-Task 추가
  const addFreeTask = (date, taskText, time = '') => {
    const newTask = {
      id: generateTaskId(),
      text: taskText,
      date: typeof date === 'string' ? date : formatDate(date),
      time,
      completed: false,
      type: 'free',
      createdAt: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      freeTasks: [...prev.freeTasks, newTask]
    }));

    return newTask;
  };

  // F-Task 수정
  const updateFreeTask = (taskId, updates) => {
    setData(prev => ({
      ...prev,
      freeTasks: prev.freeTasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      )
    }));
  };

  // F-Task 삭제
  const deleteFreeTask = (taskId) => {
    setData(prev => ({
      ...prev,
      freeTasks: prev.freeTasks.filter(t => t.id !== taskId)
    }));
  };

  // F-Task 완료 토글
  const toggleFreeTask = (taskId) => {
    setData(prev => ({
      ...prev,
      freeTasks: prev.freeTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  // 루틴 추가
  const addRoutine = (routine) => {
    const newRoutine = {
      ...routine,
      id: generateRoutineId(),
      createdAt: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      routines: [...prev.routines, newRoutine]
    }));

    return newRoutine;
  };

  // 루틴 수정
  const updateRoutine = (routineId, updates) => {
    setData(prev => ({
      ...prev,
      routines: prev.routines.map(r =>
        r.id === routineId ? { ...r, ...updates } : r
      )
    }));
  };

  // 루틴 삭제
  const deleteRoutine = (routineId) => {
    setData(prev => ({
      ...prev,
      routines: prev.routines.filter(r => r.id !== routineId)
    }));
  };

  // 설정 업데이트
  const updateSettings = (updates) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }));
  };

  // 날짜별 모든 Task 가져오기
  const getTasksForDate = (date) => {
    const dateStr = typeof date === 'string' ? date : formatDate(date);

    // P-Tasks
    const projectTasks = data.projects.flatMap(project =>
      project.tasks
        .filter(task => task.date === dateStr)
        .map(task => ({
          ...task,
          type: 'project',
          projectName: project.name,
          projectColor: project.color
        }))
    );

    // F-Tasks
    const freeTasks = data.freeTasks.filter(task => task.date === dateStr);

    // Routines - 여기서는 간단하게 처리, 실제로는 calculateRoutineDates 사용
    const routineTasks = data.routines
      .filter(r => {
        // 간단한 필터링 (실제로는 더 복잡한 로직 필요)
        return true;
      })
      .map(r => ({
        id: `${r.id}_${dateStr}`,
        text: r.text,
        type: 'routine',
        routineType: r.type,
        completed: false,
        date: dateStr
      }));

    return [...projectTasks, ...freeTasks].sort((a, b) => {
      // 정렬: P-Task > F-Task, 시간순
      if (a.type === 'project' && b.type !== 'project') return -1;
      if (a.type !== 'project' && b.type === 'project') return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  };

  // 오늘의 Task 가져오기
  const getTodayTasks = () => {
    return getTasksForDate(new Date());
  };

  const value = {
    // State
    data,
    currentView,
    currentDate,

    // Actions
    setCurrentView,
    setCurrentDate,

    // Projects
    addProject,
    updateProject,
    deleteProject,
    addProjectTask,
    toggleProjectTask,
    deleteProjectTask,

    // Free Tasks
    addFreeTask,
    updateFreeTask,
    deleteFreeTask,
    toggleFreeTask,

    // Routines
    addRoutine,
    updateRoutine,
    deleteRoutine,

    // Settings
    updateSettings,

    // Getters
    getTasksForDate,
    getTodayTasks
  };

  return (
    <SchedulerContext.Provider value={value}>
      {children}
    </SchedulerContext.Provider>
  );
};
