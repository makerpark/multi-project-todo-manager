import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import { useScheduler } from '../contexts/SchedulerContext';

const ProjectModal = ({ isOpen, onClose }) => {
  const { addProject } = useScheduler();

  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [taskList, setTaskList] = useState(['']);
  const [color, setColor] = useState('bg-blue-500');

  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ];

  const handleAddTask = () => {
    setTaskList([...taskList, '']);
  };

  const handleRemoveTask = (index) => {
    setTaskList(taskList.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index, value) => {
    const newList = [...taskList];
    newList[index] = value;
    setTaskList(newList);
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());

    if (lines.length > 1) {
      e.preventDefault();
      setTaskList([...taskList, ...lines]);
    }
  };

  const handleSubmit = () => {
    if (!projectName.trim()) {
      alert('프로젝트 이름을 입력해주세요.');
      return;
    }

    if (!startDate || !endDate) {
      alert('시작일과 종료일을 입력해주세요.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('종료일은 시작일 이후여야 합니다.');
      return;
    }

    const validTasks = taskList.filter(t => t.trim());
    if (validTasks.length === 0) {
      alert('최소 1개의 Task를 입력해주세요.');
      return;
    }

    // 프로젝트 추가
    addProject({
      name: projectName,
      startDate,
      endDate,
      color,
      tasks: validTasks.map((text, index) => ({
        text,
        completed: false
      }))
    });

    // 초기화 및 닫기
    setProjectName('');
    setStartDate('');
    setEndDate('');
    setTaskList(['']);
    setColor('bg-blue-500');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={24} className="text-blue-500" />
            프로젝트 일정 잡기
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 프로젝트 이름 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              프로젝트 이름
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="프로젝트 이름 입력"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              프로젝트 색상
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c} ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  } transition-all`}
                />
              ))}
            </div>
          </div>

          {/* 일정 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Task 리스트 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">
                할일 리스트
              </label>
              <span className="text-xs text-slate-500">
                엑셀에서 복사 붙여넣기 가능
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3">
              {taskList.map((task, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                    onPaste={index === taskList.length - 1 ? handlePaste : undefined}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && index === taskList.length - 1) {
                        handleAddTask();
                      }
                    }}
                    placeholder={`Task ${index + 1}`}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {taskList.length > 1 && (
                    <button
                      onClick={() => handleRemoveTask(index)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddTask}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus size={16} />
              Task 추가
            </button>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
