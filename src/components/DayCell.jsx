import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskItem from './TaskItem';
import { formatDisplayDate, isToday } from '../utils/dateUtils';
import { useScheduler } from '../contexts/SchedulerContext';

/**
 * 하루(Cell) 컴포넌트
 * 여러 Task를 포함
 */
const DayCell = ({ date, tasks, isCurrentMonth = true }) => {
  const {
    addFreeTask,
    toggleProjectTask,
    toggleFreeTask,
    deleteFreeTask,
    deleteProjectTask,
    updateFreeTask
  } = useScheduler();

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);

  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const dateObj = new Date(dateStr);
  const dayNumber = dateObj.getDate();
  const isTodayDate = isToday(dateObj);

  // Task 추가
  const handleAddTask = () => {
    if (newTaskText.trim()) {
      addFreeTask(dateStr, newTaskText);
      setNewTaskText('');
      setShowAddTask(false);
    }
  };

  // Task 토글
  const handleToggleTask = (task) => {
    if (task.type === 'project') {
      toggleProjectTask(task.projectId, task.id);
    } else {
      toggleFreeTask(task.id);
    }
  };

  // Task 삭제
  const handleDeleteTask = (task) => {
    if (task.type === 'project') {
      deleteProjectTask(task.projectId, task.id);
    } else {
      deleteFreeTask(task.id);
    }
  };

  // Task 시간 업데이트
  const handleUpdateTime = (task, time) => {
    if (task.type === 'free') {
      updateFreeTask(task.id, { time });
    }
    // P-Task는 시간 수정 불가 (프로젝트 레벨에서 관리)
  };

  // 드래그 시작
  const handleDragStart = (task) => (e) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // 드롭 허용
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 드롭
  const handleDrop = (e) => {
    e.preventDefault();

    if (!draggedTask) return;

    // F-Task는 자유롭게 이동 가능
    if (draggedTask.type === 'free') {
      updateFreeTask(draggedTask.id, { date: dateStr });
    }
    // P-Task는 뒤로만 이동 가능 (추후 구현)
    else if (draggedTask.type === 'project') {
      // TODO: moveProjectTask 로직 구현
      console.warn('P-Task 이동 기능은 추후 구현 예정');
    }

    setDraggedTask(null);
  };

  return (
    <div
      className={`
        min-h-[120px] border border-slate-200 rounded-lg p-2
        ${!isCurrentMonth ? 'bg-slate-50 opacity-50' : 'bg-white'}
        ${isTodayDate ? 'ring-2 ring-blue-400 shadow-md' : ''}
        hover:shadow-sm transition-all
      `}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 날짜 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setShowAddTask(true)}
          className={`
            text-sm font-semibold
            ${isTodayDate ? 'text-blue-600' : 'text-slate-700'}
            hover:text-blue-500 transition-colors
          `}
        >
          {dayNumber}
        </button>

        {/* Task 추가 버튼 */}
        {!showAddTask && (
          <button
            onClick={() => setShowAddTask(true)}
            className="opacity-0 hover:opacity-100 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-all p-1"
            title="할일 추가"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Task 입력 */}
      {showAddTask && (
        <div className="mb-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddTask();
              if (e.key === 'Escape') {
                setShowAddTask(false);
                setNewTaskText('');
              }
            }}
            onBlur={() => {
              if (!newTaskText.trim()) {
                setShowAddTask(false);
              }
            }}
            placeholder="할일 입력 후 Enter"
            className="w-full text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
        </div>
      )}

      {/* Task 목록 */}
      <div className="space-y-1">
        {tasks && tasks.length > 0 ? (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => handleToggleTask(task)}
              onDelete={() => handleDeleteTask(task)}
              onUpdateTime={(time) => handleUpdateTime(task, time)}
              onDragStart={handleDragStart(task)}
              onDragEnd={handleDragEnd}
            />
          ))
        ) : (
          !showAddTask && (
            <div className="text-xs text-slate-300 text-center py-4">
              할일 없음
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DayCell;
