
/**
 * 멀티 프로젝트 할 일 관리
 * Copyright (c) 2025 Park Yong Jae
 * Licensed under MIT License
 */

import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, FolderOpen, Edit2, ChevronUp, ChevronDown, Calendar, ChevronRight, Settings } from 'lucide-react';
import { loadProjects, loadSettings, isOverdue, formatDate, sortProjects, sortTasks } from './utils.js';

export default function ProjectTaskManager() {

  const [projects, setProjects] = useState(loadProjects);
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskTexts, setNewTaskTexts] = useState({});
  const [newTaskDates, setNewTaskDates] = useState({});
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingDates, setEditingDates] = useState({});
  const [editingTaskDate, setEditingTaskDate] = useState({});
  const [showCompletedTasks, setShowCompletedTasks] = useState({});
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);

  // 프로젝트 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('projectTaskManager', JSON.stringify(projects));
    } catch (error) {
      console.error('데이터 저장 실패:', error);
    }
  }, [projects]);

  // 설정 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('projectTaskSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }, [settings]);

  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];

  const fontSizeClasses = {
    small: { text: 'text-xs', heading: 'text-sm', subtext: 'text-[10px]', input: 'text-xs', spacing: 'space-y-0.5', padding: 'p-1' },
    medium: { text: 'text-sm', heading: 'text-base', subtext: 'text-xs', input: 'text-sm', spacing: 'space-y-1', padding: 'p-1.5' },
    large: { text: 'text-base', heading: 'text-lg', subtext: 'text-sm', input: 'text-base', spacing: 'space-y-1.5', padding: 'p-2' }
  };

  const currentSize = fontSizeClasses[settings.fontSize];

  const addProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now(),
        name: newProjectName,
        color: colors[projects.length % colors.length],
        startDate: '',
        endDate: '',
        completed: false,
        tasks: []
      };
      const updatedProjects = sortProjects([...projects, newProject]);
      setProjects(updatedProjects);
      setNewProjectName('');
      setShowAddProject(false);
    }
  };

  const updateProjectName = (projectId, newName) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, name: newName } : p
    ));
    setEditingProject(null);
  };

  const updateProjectDates = (projectId, startDate, endDate) => {
    const updatedProjects = sortProjects(
      projects.map(p =>
        p.id === projectId ? { ...p, startDate, endDate } : p
      )
    );
    setProjects(updatedProjects);
    setEditingDates({ ...editingDates, [projectId]: false });
  };

  const moveProject = (projectId, direction) => {
    const index = projects.findIndex(p => p.id === projectId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === projects.length - 1)) {
      return;
    }
    
    const newProjects = [...projects];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newProjects[index], newProjects[targetIndex]] = [newProjects[targetIndex], newProjects[index]];
    setProjects(newProjects);
  };

  const toggleProjectComplete = (projectId) => {
    const updatedProjects = sortProjects(
      projects.map(p =>
        p.id === projectId ? { ...p, completed: !p.completed } : p
      )
    );
    setProjects(updatedProjects);
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const addTask = (projectId) => {
    const taskText = newTaskTexts[projectId];
    if (taskText && taskText.trim()) {
      setProjects(projects.map(project => {
        if (project.id === projectId) {
          const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            dueDate: ''
          };
          const updatedTasks = sortTasks([...project.tasks, newTask]);
          return {
            ...project,
            tasks: updatedTasks
          };
        }
        return project;
      }));
      setNewTaskTexts({ ...newTaskTexts, [projectId]: '' });
    }
  };

  const updateTaskDate = (projectId, taskId, newDate) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = sortTasks(
          project.tasks.map(task =>
            task.id === taskId ? { ...task, dueDate: newDate } : task
          )
        );
        return { ...project, tasks: updatedTasks };
      }
      return project;
    }));
    setEditingTaskDate({ ...editingTaskDate, [taskId]: false });
  };

  const toggleTask = (projectId, taskId) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return project;
    }));
  };

  const deleteTask = (projectId, taskId) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.filter(task => task.id !== taskId)
        };
      }
      return project;
    }));
  };

  const getTodayStats = () => {
    const activeProjects = projects.filter(p => !p.completed);
    const allTasks = activeProjects.flatMap(p => p.tasks);
    const completed = allTasks.filter(t => t.completed).length;
    const total = allTasks.length;
    return { completed, total };
  };

  const stats = getTodayStats();
  const activeProjects = projects.filter(p => !p.completed);
  const completedProjects = projects.filter(p => p.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className={`${currentSize.heading} font-bold text-slate-800 mb-0.5`}>오늘의 할 일</h1>
            <p className={`${currentSize.subtext} text-slate-600`}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className={`bg-white rounded-lg px-2.5 py-1 shadow-sm ${currentSize.subtext}`}>
                <span className="text-slate-600">진행률: </span>
                <span className="font-bold text-slate-800">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                <span className="text-slate-600 ml-1">({stats.completed}/{stats.total})</span>
              </div>
            </div>
          </div>
          
          {/* 설정 버튼 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white text-slate-700 p-2 rounded-lg shadow-sm hover:shadow-md transition-all"
            title="설정"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* 설정 패널 */}
        {showSettings && (
          <div className="mb-4 bg-white rounded-lg shadow-md p-4">
            <h3 className={`${currentSize.text} font-semibold text-slate-800 mb-3`}>환경설정</h3>
            <div className="space-y-3">
              <div>
                <label className={`${currentSize.subtext} text-slate-600 block mb-1.5`}>글씨 크기</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings({ ...settings, fontSize: 'small' })}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${settings.fontSize === 'small' ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    작게
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, fontSize: 'medium' })}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${settings.fontSize === 'medium' ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    보통
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, fontSize: 'large' })}
                    className={`px-3 py-1.5 text-base rounded-lg transition-all ${settings.fontSize === 'large' ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    크게
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 프로젝트 추가 버튼 */}
        <div className="mb-3">
          {!showAddProject ? (
            <button
              onClick={() => setShowAddProject(true)}
              className={`bg-white text-slate-700 px-3 py-1.5 ${currentSize.subtext} rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5`}
            >
              <Plus size={14} />
              새 프로젝트 추가
            </button>
          ) : (
            <div className="bg-white p-2.5 rounded-lg shadow-sm">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addProject()}
                placeholder="프로젝트 이름을 입력하세요"
                className={`w-full px-2 py-1 ${currentSize.input} border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2`}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={addProject}
                  className="bg-slate-400 text-white px-3 py-1 text-xs rounded-lg hover:bg-slate-500 transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddProject(false);
                    setNewProjectName('');
                  }}
                  className="bg-slate-200 text-slate-700 px-3 py-1 text-xs rounded-lg hover:bg-slate-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 프로젝트 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeProjects.map((project, index) => {
            const incompleteTasks = project.tasks.filter(t => !t.completed);
            const completedTasks = project.tasks.filter(t => t.completed);
            
            return (
            <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* 프로젝트 헤더 */}
              <div className={`${project.color} p-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2 text-white flex-1 min-w-0">
                  <FolderOpen size={14} className="flex-shrink-0" />
                  {editingProject === project.id ? (
                    <input
                      type="text"
                      defaultValue={project.name}
                      onBlur={(e) => updateProjectName(project.id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateProjectName(project.id, e.target.value);
                        }
                      }}
                      className={`bg-white/20 text-white px-2 py-0.5 rounded ${currentSize.subtext} font-semibold outline-none flex-1 min-w-0 placeholder-white/70`}
                      autoFocus
                    />
                  ) : (
                    <h2 className={`${currentSize.text} font-semibold truncate`}>{project.name}</h2>
                  )}
                  {!editingProject && (
                    <button
                      onClick={() => setEditingProject(project.id)}
                      className="text-white hover:bg-white/20 p-0.5 rounded transition-colors flex-shrink-0"
                    >
                      <Edit2 size={11} />
                    </button>
                  )}
                </div>
                
                {/* 기간 표시 및 수정 */}
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {editingDates[project.id] ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        defaultValue={project.startDate}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          updateProjectDates(project.id, newStart, project.endDate);
                        }}
                        className={`bg-white/20 text-white ${currentSize.subtext} px-1 py-0.5 rounded outline-none w-20`}
                      />
                      <span className={`text-white ${currentSize.subtext}`}>~</span>
                      <input
                        type="date"
                        defaultValue={project.endDate}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          updateProjectDates(project.id, project.startDate, newEnd);
                        }}
                        className={`bg-white/20 text-white ${currentSize.subtext} px-1 py-0.5 rounded outline-none w-20`}
                      />
                    </div>
                  ) : (
                    <>
                      {(project.startDate || project.endDate) && (
                        <span className={`text-white ${currentSize.subtext}`}>
                          {project.startDate && new Date(project.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          {project.startDate && project.endDate && ' ~ '}
                          {project.endDate && new Date(project.endDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <button
                        onClick={() => setEditingDates({ ...editingDates, [project.id]: true })}
                        className="text-white hover:bg-white/20 p-0.5 rounded transition-colors"
                      >
                        <Calendar size={11} />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-white hover:bg-white/20 p-0.5 rounded transition-colors ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* 할 일 목록 */}
              <div className="p-2">
                {/* 진행 중인 할 일 */}
                <div className={`${currentSize.spacing} mb-2`}>
                  {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
                    <p className={`text-slate-400 ${currentSize.subtext} text-center py-2`}>할 일이 없습니다</p>
                  ) : incompleteTasks.length === 0 ? (
                    <p className={`text-emerald-600 ${currentSize.subtext} text-center py-2 font-medium`}>모든 할 일을 완료했습니다! 🎉</p>
                  ) : (
                    incompleteTasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-2 ${currentSize.padding} rounded hover:bg-slate-50 transition-colors group`}
                      >
                        <button
                          onClick={() => toggleTask(project.id, task.id)}
                          className={`flex-shrink-0 w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all border-slate-300 hover:border-slate-400`}
                        >
                        </button>
                        <span className={`flex-1 ${currentSize.text} text-slate-700 min-w-0`}>
                          {task.text}
                        </span>
                        {editingTaskDate[task.id] ? (
                          <input
                            type="date"
                            defaultValue={task.dueDate}
                            onChange={(e) => updateTaskDate(project.id, task.id, e.target.value)}
                            onBlur={() => setEditingTaskDate({ ...editingTaskDate, [task.id]: false })}
                            className={`${currentSize.subtext} px-1 py-0.5 border border-slate-300 rounded outline-none w-24`}
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingTaskDate({ ...editingTaskDate, [task.id]: true })}
                            className={`${currentSize.subtext} ${isOverdue(task.dueDate) ? 'text-rose-600 font-medium' : 'text-slate-500'} hover:text-slate-700 transition-colors flex-shrink-0`}
                            title="일자 설정"
                          >
                            {task.dueDate ? formatDate(task.dueDate) : '날짜 없음'}
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(project.id, task.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all flex-shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* 완료된 할 일 드롭다운 */}
                {completedTasks.length > 0 && (
                  <div className="mb-2 border-t pt-1.5">
                    <button
                      onClick={() => setShowCompletedTasks({ ...showCompletedTasks, [project.id]: !showCompletedTasks[project.id] })}
                      className={`flex items-center gap-1 ${currentSize.subtext} text-slate-500 hover:text-slate-700 transition-colors mb-1`}
                    >
                      <ChevronRight size={12} className={`transition-transform ${showCompletedTasks[project.id] ? 'rotate-90' : ''}`} />
                      완료된 할 일 ({completedTasks.length})
                    </button>
                    
                    {showCompletedTasks[project.id] && (
                      <div className={`${currentSize.spacing} pl-2`}>
                        {completedTasks.map(task => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-2 ${currentSize.padding} rounded hover:bg-slate-50 transition-colors group`}
                          >
                            <button
                              onClick={() => toggleTask(project.id, task.id)}
                              className={`flex-shrink-0 w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${project.color} border-transparent`}
                            >
                              <Check size={10} className="text-white" />
                            </button>
                            <span className={`flex-1 ${currentSize.text} line-through text-slate-400 min-w-0`}>
                              {task.text}
                            </span>
                            {task.dueDate && (
                              <span className={`${currentSize.subtext} text-slate-400 line-through flex-shrink-0`}>
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                            <button
                              onClick={() => deleteTask(project.id, task.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all flex-shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 할 일 추가 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTexts[project.id] || ''}
                    onChange={(e) => setNewTaskTexts({ ...newTaskTexts, [project.id]: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && addTask(project.id)}
                    placeholder="새 할 일 추가..."
                    className={`flex-1 px-2 py-1 ${currentSize.input} border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400`}
                  />
                  <button
                    onClick={() => addTask(project.id)}
                    className="bg-slate-300 text-slate-700 p-1 rounded-lg hover:bg-slate-400 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                {/* 프로젝트 완료 버튼 */}
                {incompleteTasks.length === 0 && project.tasks.length > 0 && (
                  <button
                    onClick={() => toggleProjectComplete(project.id)}
                    className={`w-full mt-2 bg-emerald-500 text-white ${currentSize.subtext} py-1.5 rounded-lg hover:bg-emerald-600 transition-colors font-medium`}
                  >
                    프로젝트 완료로 이동
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {activeProjects.length === 0 && !showCompletedProjects && (
          <div className="text-center py-8 text-slate-400">
            <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p className={currentSize.subtext}>프로젝트를 추가하여 시작하세요</p>
          </div>
        )}

        {/* 완료된 프로젝트 섹션 */}
        {completedProjects.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowCompletedProjects(!showCompletedProjects)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-3"
            >
              <ChevronRight size={16} className={`transition-transform ${showCompletedProjects ? 'rotate-90' : ''}`} />
              <span className={`${currentSize.subtext} font-medium`}>지난 프로젝트 보기 ({completedProjects.length})</span>
            </button>
            
            {showCompletedProjects && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedProjects.map(project => (
                  <div key={project.id} className="bg-slate-50 rounded-lg shadow-sm overflow-hidden opacity-75">
                    <div className={`${project.color} p-2 flex items-center justify-between opacity-70`}>
                      <div className="flex items-center gap-2 text-white flex-1 min-w-0">
                        <Check size={14} className="flex-shrink-0" />
                        <h2 className={`${currentSize.text} font-semibold truncate`}>{project.name}</h2>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {(project.startDate || project.endDate) && (
                          <span className={`text-white ${currentSize.subtext}`}>
                            {project.startDate && new Date(project.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            {project.startDate && project.endDate && ' ~ '}
                            {project.endDate && new Date(project.endDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <button
                          onClick={() => toggleProjectComplete(project.id)}
                          className="text-white hover:bg-white/20 p-0.5 rounded transition-colors ml-2"
                          title="활성 프로젝트로 복원"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-white hover:bg-white/20 p-0.5 rounded transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className={currentSize.spacing}>
                        {project.tasks.map(task => (
                          <div key={task.id} className={`flex items-center gap-2 ${currentSize.padding} ${currentSize.text} text-slate-500`}>
                            <Check size={10} className="flex-shrink-0" />
                            <span className="line-through">{task.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 크레딧 */}
      <div className="text-xs text-slate-400 text-center mt-6 pb-4">
        Created by Park Yong Jae © 2025
      </div>
    </div>
  );
}
