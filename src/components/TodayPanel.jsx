import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useScheduler } from '../contexts/SchedulerContext';
import TaskItem from './TaskItem';

const TodayPanel = () => {
  const { getTodayTasks, toggleProjectTask, toggleFreeTask } = useScheduler();

  const todayTasks = getTodayTasks();
  const completedCount = todayTasks.filter(t => t.completed).length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 mb-2">오늘의 할일</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-600">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Task 목록 */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {todayTasks.length > 0 ? (
          todayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => {
                if (task.type === 'project') {
                  toggleProjectTask(task.projectId, task.id);
                } else {
                  toggleFreeTask(task.id);
                }
              }}
              isDraggable={false}
            />
          ))
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Circle size={48} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">오늘 할일이 없습니다</p>
            <p className="text-xs mt-1">캘린더에서 할일을 추가해보세요!</p>
          </div>
        )}
      </div>

      {completedCount === totalCount && totalCount > 0 && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-center">
          <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-1" />
          <p className="text-sm font-semibold text-emerald-700">
            모든 할일을 완료했습니다! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default TodayPanel;
