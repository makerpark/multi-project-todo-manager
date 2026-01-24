import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DayCell from './DayCell';
import { getWeekDays, formatDate } from '../utils/dateUtils';
import { useScheduler } from '../contexts/SchedulerContext';
import { addWeeks, format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';

const WeekView = () => {
  const { currentDate, setCurrentDate, getTasksForDate } = useScheduler();

  const weekDays = getWeekDays(currentDate);
  const weekDaysKo = ['월', '화', '수', '목', '금', '토', '일'];

  const handlePrevWeek = () => {
    setCurrentDate(addWeeks(currentDate, -1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h2 className="text-xl font-bold text-slate-800">
          {format(currentDate, 'yyyy년 M월', { locale: ko })}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            오늘
          </button>

          <button
            onClick={handlePrevWeek}
            className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={handleNextWeek}
            className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDaysKo.map((day, index) => (
          <div
            key={index}
            className={`text-center text-sm font-semibold py-2 ${
              index >= 5 ? 'text-rose-500' : 'text-slate-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 주간 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-2 flex-1">
        {weekDays.map((day) => {
          const dateStr = formatDate(day);
          const tasks = getTasksForDate(dateStr);

          return (
            <DayCell
              key={dateStr}
              date={day}
              tasks={tasks}
              isCurrentMonth={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
