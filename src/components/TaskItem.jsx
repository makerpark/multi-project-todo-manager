import React, { useState } from 'react';
import { Check, Trash2, Clock, X } from 'lucide-react';

/**
 * Task 아이템 컴포넌트
 * P-Task, F-Task 모두 사용
 */
const TaskItem = ({
  task,
  onToggle,
  onDelete,
  onUpdateTime,
  isDraggable = true,
  onDragStart,
  onDragEnd
}) => {
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [timeValue, setTimeValue] = useState(task.time || '');

  const handleTimeSubmit = () => {
    if (onUpdateTime) {
      onUpdateTime(timeValue);
    }
    setShowTimeInput(false);
  };

  const isPTask = task.type === 'project';
  const isRoutine = task.type === 'routine';

  return (
    <div
      className={`
        group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-all
        ${isDraggable ? 'cursor-move' : ''}
        ${task.completed ? 'opacity-60' : ''}
      `}
      draggable={isDraggable && !task.completed}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* 체크박스 */}
      <button
        onClick={onToggle}
        className={`
          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5
          ${task.completed
            ? isPTask
              ? `${task.projectColor || 'bg-blue-500'} border-transparent`
              : 'bg-emerald-500 border-transparent'
            : 'border-slate-300 hover:border-slate-400'
          }
        `}
      >
        {task.completed && <Check size={14} className="text-white" />}
      </button>

      {/* Task 내용 */}
      <div className="flex-1 min-w-0">
        {/* Task 텍스트 */}
        <div className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {task.text.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>

        {/* 프로젝트 정보 (P-Task인 경우) */}
        {isPTask && (
          <div className="flex items-center gap-1 mt-1">
            <div className={`w-2 h-2 rounded-full ${task.projectColor}`} />
            <span className="text-xs text-slate-500">{task.projectName}</span>
          </div>
        )}

        {/* 루틴 정보 */}
        {isRoutine && (
          <span className="text-xs text-purple-600 mt-1 inline-block">
            {task.routineType === 'daily' && '매일'}
            {task.routineType === 'weekly' && '매주'}
            {task.routineType === 'monthly' && '매월'}
            {task.routineType === 'yearly' && '매년'}
          </span>
        )}

        {/* 시간 표시 */}
        {!showTimeInput && task.time && (
          <div className="flex items-center gap-1 mt-1">
            <Clock size={12} className="text-slate-400" />
            <span className="text-xs text-slate-500">{task.time}</span>
          </div>
        )}

        {/* 시간 입력 */}
        {showTimeInput && (
          <div className="flex items-center gap-1 mt-1">
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1"
              autoFocus
            />
            <button
              onClick={handleTimeSubmit}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setShowTimeInput(false);
                setTimeValue(task.time || '');
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 시간 설정 버튼 */}
        {onUpdateTime && !showTimeInput && (
          <button
            onClick={() => setShowTimeInput(true)}
            className="text-slate-400 hover:text-blue-500 transition-colors p-1"
            title="시간 설정"
          >
            <Clock size={14} />
          </button>
        )}

        {/* 삭제 버튼 */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
            title="삭제"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
