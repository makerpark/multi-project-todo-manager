import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DayCell from './DayCell';
import { getMonthDays, formatDate } from '../utils/dateUtils';
import { useScheduler } from '../contexts/SchedulerContext';
import { addMonths, format, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

const MonthView = () => {
  const { currentDate, setCurrentDate, getTasksForDate } = useScheduler();

  const monthDays = getMonthDays(currentDate);
  const weekDaysKo = ['월', '화', '수', '목', '금', '토', '일'];

  const handlePrevMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 주 단위로 그룹화
  const weeks = [];
  for (let i = 0; i < monthDays.length; i += 7) {
    weeks.push(monthDays.slice(i, i + 7));
  }

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
            onClick={handlePrevMonth}
            className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={handleNextMonth}
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

      {/* 월간 캘린더 그리드 */}
      <div className="flex-1 flex flex-col gap-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2 flex-1">
            {week.map((day) => {
              const dateStr = formatDate(day);
              const tasks = getTasksForDate(dateStr);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <DayCell
                  key={dateStr}
                  date={day}
                  tasks={tasks}
                  isCurrentMonth={isCurrentMonth}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;
