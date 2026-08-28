import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  Trash2,
  Edit2,
  Check,
  Flame,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Task, Priority, TaskCategory, TaskStatus, ThemeAccent } from '../types';

interface TaskViewProps {
  tasks: Task[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  themeAccent: ThemeAccent;
}

export const TaskView: React.FC<TaskViewProps> = ({
  tasks,
  onSaveTask,
  onDeleteTask,
  themeAccent,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskDate, setTaskDate] = useState(todayStr);
  const [taskTime, setTaskTime] = useState('18:00');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [subtasksInput, setSubtasksInput] = useState('');

  const openAddModal = (date?: string) => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setTaskDate(date || selectedDate);
    setTaskTime('18:00');
    setPriority('medium');
    setCategory('personal');
    setSubtasksInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setTaskDate(task.date);
    setTaskTime(task.time || '18:00');
    setPriority(task.priority);
    setCategory(task.category);
    setSubtasksInput(task.subtasks?.map((s) => s.title).join('\n') || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const subtasksList = subtasksInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s, idx) => ({
        id: `sub_${Date.now()}_${idx}`,
        title: s,
        completed: false,
      }));

    const taskToSave: Task = {
      id: editingTask ? editingTask.id : `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      date: taskDate,
      time: taskTime || undefined,
      priority,
      category,
      status: editingTask ? editingTask.status : 'todo',
      subtasks: subtasksList.length > 0 ? subtasksList : editingTask?.subtasks,
      createdAt: editingTask ? editingTask.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSaveTask(taskToSave);
    setIsModalOpen(false);
  };

  const toggleTaskStatus = (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    onSaveTask({
      ...task,
      status: nextStatus,
      updatedAt: Date.now(),
    });
  };

  const toggleSubtask = (task: Task, subtaskId: string) => {
    if (!task.subtasks) return;
    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    const allDone = updatedSubtasks.every((s) => s.completed);
    onSaveTask({
      ...task,
      subtasks: updatedSubtasks,
      status: allDone ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status,
      updatedAt: Date.now(),
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (task.date !== selectedDate) return false;
    if (filterStatus === 'pending' && task.status === 'completed') return false;
    if (filterStatus === 'completed' && task.status !== 'completed') return false;
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const totalForDate = tasks.filter((t) => t.date === selectedDate).length;
  const completedForDate = tasks.filter((t) => t.date === selectedDate && t.status === 'completed').length;
  const progressPercent = totalForDate > 0 ? Math.round((completedForDate / totalForDate) * 100) : 0;
  const highPriorityCount = tasks.filter((t) => t.date === selectedDate && t.priority === 'high' && t.status !== 'completed').length;

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'high':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800/80 text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ด่วนสูง</span>;
      case 'medium':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300">ปานกลาง</span>;
      case 'low':
        return <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800/60 text-blue-300">ทั่วไป</span>;
    }
  };

  const getCategoryBadge = (c: TaskCategory) => {
    const labels: Record<TaskCategory, { text: string; color: string }> = {
      study: { text: '📚 การเรียน', color: 'text-purple-300 border-purple-800/60 bg-purple-950/40' },
      work: { text: '💼 งาน', color: 'text-blue-300 border-blue-800/60 bg-blue-950/40' },
      personal: { text: '👤 ส่วนตัว', color: 'text-emerald-300 border-emerald-800/60 bg-emerald-950/40' },
      coding: { text: '💻 เขียนโปรแกรม', color: 'text-cyan-300 border-cyan-800/60 bg-cyan-950/40' },
      finance: { text: '💰 การเงิน', color: 'text-amber-300 border-amber-800/60 bg-amber-950/40' },
      other: { text: '📌 อื่นๆ', color: 'text-slate-300 border-slate-700 bg-slate-800/50' },
    };
    const item = labels[c] || labels.other;
    return <span className={`text-[11px] px-2 py-0.5 rounded-full border ${item.color}`}>{item.text}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card with Quick Stats & Date Picker */}
      <div className="bg-[#12141f] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>DAILY TO-DO PLANNER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              รายการสิ่งที่ต้องทำประจำวัน
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              จัดระเบียบเป้าหมายรายวัน บริหารเวลา และซิงค์แบบเรียลไทม์กับ Firebase
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Quick Date Switcher */}
            <button
              id="task-btn-today"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === todayStr
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              วันนี้
            </button>
            <button
              id="task-btn-tomorrow"
              onClick={() => {
                const tmr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                setSelectedDate(tmr);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              พรุ่งนี้
            </button>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <input
                id="task-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              id="btn-add-task"
              onClick={() => openAddModal()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950 transition-transform active:scale-95 ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มงานใหม่</span>
            </button>
          </div>
        </div>

        {/* Progress & Stat Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-[#181a28] rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">ความคืบหน้ารวม</span>
              <div className="text-xl font-extrabold text-white mt-0.5">
                {completedForDate} / {totalForDate} งาน
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">
              {progressPercent}%
            </div>
          </div>

          <div className="bg-[#181a28] rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">งานด่วนสำคัญ (High Priority)</span>
              <div className="text-xl font-extrabold text-red-400 mt-0.5">
                {highPriorityCount} งานที่เหลือ
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 font-bold">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#181a28] rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">วันที่เลือก</span>
              <div className="text-sm font-bold text-slate-200 mt-1">
                {new Date(selectedDate).toLocaleDateString('th-TH', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#10121b] border border-slate-800/80 rounded-xl p-3 text-xs">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-semibold mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> สถานะ:
          </span>
          <button
            id="filter-all-tasks"
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ทั้งหมด ({totalForDate})
          </button>
          <button
            id="filter-pending-tasks"
            onClick={() => setFilterStatus('pending')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending' ? 'bg-red-900/60 text-red-300 border border-red-700/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            รอดำเนินการ ({totalForDate - completedForDate})
          </button>
          <button
            id="filter-completed-tasks"
            onClick={() => setFilterStatus('completed')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filterStatus === 'completed' ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            เสร็จสิ้นแล้ว ({completedForDate})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            id="select-filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value="all">ทุกหมวดหมู่</option>
            <option value="study">📚 การเรียน</option>
            <option value="work">💼 งาน</option>
            <option value="coding">💻 เขียนโปรแกรม</option>
            <option value="finance">💰 การเงิน</option>
            <option value="personal">👤 ส่วนตัว</option>
            <option value="other">📌 อื่นๆ</option>
          </select>

          <select
            id="select-filter-priority"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value="all">ทุกความสำคัญ</option>
            <option value="high">🔥 ด่วนสูง</option>
            <option value="medium">⚡ ปานกลาง</option>
            <option value="low">🌱 ทั่วไป</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-[#12141f]/70 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3 text-2xl">
              📝
            </div>
            <h3 className="text-base font-bold text-slate-200">ยังไม่มีรายการสิ่งที่ต้องทำสำหรับวันนี้</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              เริ่มต้นวางแผนวันของคุณด้วยการเพิ่มงานใหม่ แล้วเคลียร์ภารกิจทีละข้ออย่างมีประสิทธิภาพ
            </p>
            <button
              id="btn-empty-add-task"
              onClick={() => openAddModal()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มงานแรกของวัน</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            return (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className={`group rounded-2xl border transition-all duration-200 p-4 ${
                  isDone
                    ? 'bg-[#0f111a]/60 border-slate-800/60 opacity-60'
                    : 'bg-[#141624] border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <button
                      id={`btn-toggle-task-${task.id}`}
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5 hover:text-red-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`font-semibold text-sm sm:text-base leading-snug break-words ${
                            isDone ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </h4>
                        {getPriorityBadge(task.priority)}
                        {getCategoryBadge(task.category)}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks List */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-3 pl-2 border-l-2 border-slate-700 space-y-1.5">
                          {task.subtasks.map((st) => (
                            <div
                              key={st.id}
                              onClick={() => toggleSubtask(task, st.id)}
                              className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer hover:text-white"
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  st.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'
                                }`}
                              >
                                {st.completed && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className={st.completed ? 'line-through text-slate-500' : ''}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Task Meta Footer */}
                      <div className="flex items-center space-x-4 mt-3 text-[11px] text-slate-500">
                        {task.time && (
                          <div className="flex items-center space-x-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.time} น.</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{task.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`btn-edit-task-${task.id}`}
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                      title="แก้ไขงาน"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`btn-delete-task-${task.id}`}
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="ลบงาน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#151726] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-red-500">⚡</span>
                {editingTask ? 'แก้ไขงาน To-Do' : 'เพิ่มงาน To-Do ใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ชื่องาน / กิจกรรมที่ต้องทำ <span className="text-red-400">*</span>
                </label>
                <input
                  id="input-task-title"
                  type="text"
                  required
                  placeholder="เช่น ทบทวนโจทย์ Python เรื่อง Functions, จ่ายค่าหอพัก"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  รายละเอียดเพิ่มเติม (Optional)
                </label>
                <textarea
                  id="input-task-desc"
                  rows={2}
                  placeholder="บันทึกข้อความ ลิงก์ หรือรายละเอียดที่จำเป็น..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    วันที่กำหนด
                  </label>
                  <input
                    id="input-task-date"
                    type="date"
                    required
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    เวลาที่ต้องทำ
                  </label>
                  <input
                    id="input-task-time"
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ระดับความสำคัญ
                  </label>
                  <select
                    id="select-task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="high">🔥 ด่วนมาก (High)</option>
                    <option value="medium">⚡ ปานกลาง (Medium)</option>
                    <option value="low">🌱 ทั่วไป (Low)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    หมวดหมู่
                  </label>
                  <select
                    id="select-task-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="study">📚 การเรียน</option>
                    <option value="work">💼 งาน</option>
                    <option value="coding">💻 เขียนโปรแกรม</option>
                    <option value="finance">💰 การเงิน</option>
                    <option value="personal">👤 ส่วนตัว</option>
                    <option value="other">📌 อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ข้อย่อย / Subtasks (พิมพ์แยกบรรทัดละ 1 ข้อ)
                </label>
                <textarea
                  id="input-task-subtasks"
                  rows={2}
                  placeholder="เช่น:\nอ่านทบทวนบทที่ 3\nทำแบบฝึกหัดข้อ 1-5"
                  value={subtasksInput}
                  onChange={(e) => setSubtasksInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-save-task-submit"
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950 transition-all"
                >
                  {editingTask ? 'บันทึกการแก้ไข' : 'บันทึกงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
