import { formatDate, getWorkDays, parseDate } from './dateUtils';

/**
 * 프로젝트 Task를 날짜별로 자동 배정
 */
export const distributeProjectTasks = (project, settings) => {
  const { startDate, endDate, tasks } = project;

  if (!startDate || !endDate || !tasks || tasks.length === 0) {
    return tasks;
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const workDays = getWorkDays(start, end, settings);

  // 작업 가능 일수 확인
  const availableDays = workDays.length;
  const taskCount = tasks.length;

  if (availableDays < taskCount) {
    // 작업 가능 일수가 부족한 경우
    console.warn(`작업 가능 일수(${availableDays}일)가 Task 수(${taskCount}개)보다 적습니다.`);
    // 여러 Task를 하루에 배정
    const tasksPerDay = Math.ceil(taskCount / availableDays);
    let taskIndex = 0;

    return tasks.map((task, index) => {
      const dayIndex = Math.floor(index / tasksPerDay);
      const assignedDate = dayIndex < workDays.length
        ? formatDate(workDays[dayIndex])
        : formatDate(workDays[workDays.length - 1]);

      return {
        ...task,
        date: assignedDate,
        order: index
      };
    });
  }

  // 정상적인 경우: 하루에 한 Task씩 배정
  return tasks.map((task, index) => ({
    ...task,
    date: formatDate(workDays[index]),
    order: index
  }));
};

/**
 * P-Task 이동 시 나머지 Task들도 함께 이동
 */
export const moveProjectTask = (tasks, movedTask, newDate, settings) => {
  const movedIndex = tasks.findIndex(t => t.id === movedTask.id);
  if (movedIndex === -1) return tasks;

  const oldDate = parseDate(movedTask.date);
  const targetDate = parseDate(newDate);

  // 뒤로만 이동 가능
  if (targetDate < oldDate) {
    return { success: false, message: 'P-Task는 앞으로 이동할 수 없습니다.' };
  }

  const newTasks = [...tasks];
  const remainingTasks = newTasks.slice(movedIndex);

  // 이동할 날짜부터 작업 가능한 날짜들 계산
  const project = { startDate: newDate, endDate: tasks[tasks.length - 1].date };
  const workDays = getWorkDays(targetDate, parseDate(project.endDate), settings);

  if (workDays.length < remainingTasks.length) {
    return {
      success: false,
      message: `종료일까지 작업 가능 일수(${workDays.length}일)가 부족합니다. Task를 ${remainingTasks.length - workDays.length}개 합치거나 종료일을 수정해주세요.`
    };
  }

  // Task들 재배정
  remainingTasks.forEach((task, index) => {
    newTasks[movedIndex + index] = {
      ...task,
      date: formatDate(workDays[index])
    };
  });

  return { success: true, tasks: newTasks };
};

/**
 * Task 합치기
 */
export const mergeTasks = (task1, task2) => {
  return {
    ...task1,
    text: `${task1.text}\n${task2.text}`,
    merged: true
  };
};

/**
 * 날짜별 Task 그룹화
 */
export const groupTasksByDate = (tasks) => {
  return tasks.reduce((acc, task) => {
    const date = task.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});
};

/**
 * Task ID 생성
 */
export const generateTaskId = () => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Project ID 생성
 */
export const generateProjectId = () => {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Routine ID 생성
 */
export const generateRoutineId = () => {
  return `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
