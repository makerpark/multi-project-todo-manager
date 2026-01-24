import React, { useState } from 'react';
import { SchedulerProvider, useScheduler } from './contexts/SchedulerContext';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import TodayPanel from './components/TodayPanel';
import ProjectModal from './components/ProjectModal';
import { Calendar, CalendarDays, FolderPlus, Repeat } from 'lucide-react';

const ProTodoScheduler = () => {
  const { currentView, setCurrentView } = useScheduler();
  const [showProjectModal, setShowProjectModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            ProTodo 스케줄러
          </h1>
          <p className="text-slate-600">
            프로젝트, 업무, 루틴을 한 곳에서 관리하세요
          </p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽: 캘린더 뷰 (3/4) */}
          <div className="lg:col-span-3">
            {/* 뷰 전환 및 액션 버튼 */}
            <div className="mb-4 flex items-center justify-between">
              {/* 뷰 전환 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('week')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${currentView === 'week'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <CalendarDays size={18} />
                  주간
                </button>
                <button
                  onClick={() => setCurrentView('month')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${currentView === 'month'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <Calendar size={18} />
                  월간
                </button>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                >
                  <FolderPlus size={18} />
                  프로젝트 일정
                </button>
                {/*
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-md"
                >
                  <Repeat size={18} />
                  루틴 일정
                </button>
                */}
              </div>
            </div>

            {/* 캘린더 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              {currentView === 'week' ? <WeekView /> : <MonthView />}
            </div>
          </div>

          {/* 오른쪽: 오늘의 할일 (1/4) */}
          <div className="lg:col-span-1">
            <TodayPanel />
          </div>
        </div>

        {/* 프로젝트 모달 */}
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
        />

        {/* 크레딧 */}
        <div className="text-xs text-slate-400 text-center mt-6 pb-4">
          ProTodo Scheduler © 2025 Park Yong Jae
        </div>
      </div>
    </div>
  );
};

// App을 SchedulerProvider로 감싸기
const App = () => {
  return (
    <SchedulerProvider>
      <ProTodoScheduler />
    </SchedulerProvider>
  );
};

export default App;
