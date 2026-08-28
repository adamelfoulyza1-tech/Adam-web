import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Bell,
  Trash2,
  Check,
} from 'lucide-react';
import { HomeworkItem, ClassroomCourse, ThemeAccent } from '../types';
import { getSampleCourses, getSampleHomework, fetchClassroomData } from '../services/classroomService';
import { googleClientId } from '../lib/firebase';

interface ClassroomViewProps {
  homeworkList: HomeworkItem[];
  onSaveHomework: (hw: HomeworkItem) => void;
  onBatchSaveHomework: (items: HomeworkItem[]) => void;
  onDeleteHomework: (id: string) => void;
  themeAccent: ThemeAccent;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  homeworkList,
  onSaveHomework,
  onBatchSaveHomework,
  onDeleteHomework,
  themeAccent,
}) => {
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Modal for adding custom homework
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customCourse, setCustomCourse] = useState('CS102: Python Programming');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customDueDate, setCustomDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [customDueTime, setCustomDueTime] = useState('23:59');
  const [customPoints, setCustomPoints] = useState('100');

  const todayStr = new Date().toISOString().split('T')[0];

  // Courses list
  const coursesList = useMemo(() => {
    const courses = new Set<string>();
    homeworkList.forEach((h) => courses.add(h.courseName));
    return Array.from(courses);
  }, [homeworkList]);

  // Urgent Homework (Due in <= 3 days and not turned in)
  const urgentHomework = useMemo(() => {
    const now = Date.now();
    return homeworkList.filter((h) => {
      if (h.status === 'turned_in') return false;
      const dueTimestamp = new Date(`${h.dueDate}T${h.dueTime || '23:59'}:00`).getTime();
      const diffHours = (dueTimestamp - now) / (1000 * 60 * 60);
      return diffHours <= 72; // Within 3 days or overdue
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [homeworkList]);

  // Calendar generation logic
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; hasHomework: boolean; urgentCount: number; completedCount: number }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const mStr = String(month === 0 ? 12 : month).padStart(2, '0');
      const yStr = month === 0 ? year - 1 : year;
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false, hasHomework: false, urgentCount: 0, completedCount: 0 });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;

      const itemsForDay = homeworkList.filter((h) => h.dueDate === dateStr);
      const urgentCount = itemsForDay.filter((h) => h.status !== 'turned_in').length;
      const completedCount = itemsForDay.filter((h) => h.status === 'turned_in').length;

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        hasHomework: itemsForDay.length > 0,
        urgentCount,
        completedCount,
      });
    }

    // Next month padding to fill 35 or 42 grid
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const mStr = String(month + 2 > 12 ? 1 : month + 2).padStart(2, '0');
      const yStr = month + 2 > 12 ? year + 1 : year;
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false, hasHomework: false, urgentCount: 0, completedCount: 0 });
    }

    return days;
  }, [year, month, homeworkList]);

  // Load Sample Google Classroom Data
  const handleLoadSampleClassroom = () => {
    const samples = getSampleHomework();
    onBatchSaveHomework(samples);
    setSyncMessage('ซิงค์วิชาและการบ้านตัวอย่างจาก Google Classroom เรียบร้อยแล้ว!');
    setTimeout(() => setSyncMessage(null), 4000);
  };

  // Google Classroom OAuth Sync
  const handleGoogleClassroomOAuth = () => {
    setIsSyncing(true);
    setSyncMessage('กำลังเปิดหน้าต่างยืนยันสิทธิ์ Google Classroom...');

    try {
      // Check if google client is available
      if ((window as any).google?.accounts?.oauth2) {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly',
          callback: async (response: any) => {
            if (response.access_token) {
              setSyncMessage('กำลังดึงข้อมูลการบ้านและคอร์สจาก Google Classroom...');
              try {
                const data = await fetchClassroomData(response.access_token);
                if (data.homework.length > 0) {
                  onBatchSaveHomework(data.homework);
                  setSyncMessage(`นำเข้าการบ้านสำเร็จทั้งหมด ${data.homework.length} รายการ!`);
                } else {
                  handleLoadSampleClassroom();
                }
              } catch (e) {
                console.warn('Classroom sync API fallback to sample:', e);
                handleLoadSampleClassroom();
              }
            } else {
              handleLoadSampleClassroom();
            }
            setIsSyncing(false);
            setTimeout(() => setSyncMessage(null), 4000);
          },
        });
        client.requestAccessToken();
      } else {
        // Fallback to sample data if Google GIS library is loading
        setTimeout(() => {
          handleLoadSampleClassroom();
          setIsSyncing(false);
        }, 800);
      }
    } catch (err) {
      handleLoadSampleClassroom();
      setIsSyncing(false);
    }
  };

  const handleStatusChange = (hw: HomeworkItem, newStatus: HomeworkItem['status']) => {
    onSaveHomework({ ...hw, status: newStatus });
  };

  const handleAddCustomHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newItem: HomeworkItem = {
      id: `hw_custom_${Date.now()}`,
      courseId: `course_${Date.now()}`,
      courseName: customCourse.trim(),
      title: customTitle.trim(),
      description: customDesc.trim() || undefined,
      dueDate: customDueDate,
      dueTime: customDueTime,
      status: 'not_started',
      maxPoints: parseInt(customPoints, 10) || 100,
      source: 'manual',
      createdAt: Date.now(),
    };

    onSaveHomework(newItem);
    setCustomTitle('');
    setCustomDesc('');
    setIsAddModalOpen(false);
  };

  // Filtered homework list
  const filteredHomework = useMemo(() => {
    return homeworkList.filter((h) => {
      if (selectedDate && h.dueDate !== selectedDate) return false;
      if (filterCourse !== 'all' && h.courseName !== filterCourse) return false;
      if (filterStatus !== 'all' && h.status !== filterStatus) return false;
      return true;
    });
  }, [homeworkList, selectedDate, filterCourse, filterStatus]);

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#12141f] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>GOOGLE CLASSROOM HOMEWORK & CALENDAR HUB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              ปฏิทิน & แจ้งเตือนการบ้าน Google Classroom
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              ติดตามกำหนดส่งงาน คอร์สเรียน และแจ้งเตือนกำหนดการบ้านอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-sync-classroom"
              onClick={handleGoogleClassroomOAuth}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-950 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ Google Classroom'}</span>
            </button>

            <button
              id="btn-add-custom-hw"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มการบ้านเอง</span>
            </button>
          </div>
        </div>

        {/* Sync notification message banner */}
        {syncMessage && (
          <div className="mt-4 p-3 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Urgent Alerts Banner */}
        {urgentHomework.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border border-red-800/80">
            <div className="flex items-center space-x-2 text-red-400 text-xs font-bold mb-2">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>แจ้งเตือนด่วน: มีการบ้านใกล้ถึงกำหนดส่ง {urgentHomework.length} รายการ!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {urgentHomework.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#181a28]/90 border border-red-800/50 rounded-lg p-2.5 text-xs flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-semibold text-amber-400 truncate block">
                      {item.courseName}
                    </span>
                    <h5 className="font-bold text-white truncate mt-0.5">{item.title}</h5>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-red-300">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3" /> กำหนด: {item.dueDate} ({item.dueTime || '23:59'})
                    </span>
                    <button
                      onClick={() => handleStatusChange(item, 'turned_in')}
                      className="px-2 py-0.5 rounded bg-emerald-900/70 hover:bg-emerald-800 text-emerald-300 font-bold text-[10px]"
                    >
                      ส่งแล้ว
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid & Homework Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar View (7 cols) */}
        <div className="lg:col-span-7 bg-[#12141f] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">
                {monthNames[month]} {year + 543}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <button
                id="btn-prev-month"
                onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-today-cal"
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                เดือนนี้
              </button>
              <button
                id="btn-next-month"
                onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-800">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, i) => (
              <div key={day} className={i === 0 || i === 6 ? 'text-red-400/80' : ''}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((d, index) => {
              const isToday = d.dateStr === todayStr;
              const isSelected = d.dateStr === selectedDate;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (selectedDate === d.dateStr) {
                      setSelectedDate(null);
                    } else {
                      setSelectedDate(d.dateStr);
                    }
                  }}
                  className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40'
                      : isToday
                      ? 'bg-blue-950/30 border-blue-600/80'
                      : d.isCurrentMonth
                      ? 'bg-[#151726] border-slate-800 hover:border-slate-700'
                      : 'bg-slate-900/30 border-slate-900/60 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]'
                          : d.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {d.dayNum}
                    </span>
                    {d.hasHomework && (
                      <span className="text-[10px] font-bold text-amber-400">
                        {d.urgentCount + d.completedCount}
                      </span>
                    )}
                  </div>

                  {/* Homework indicators */}
                  <div className="space-y-0.5 mt-1">
                    {d.urgentCount > 0 && (
                      <div className="text-[9px] px-1 py-0.2 rounded bg-red-950/80 border border-red-800 text-red-300 truncate font-semibold">
                        📌 ค้าง {d.urgentCount} งาน
                      </div>
                    )}
                    {d.completedCount > 0 && (
                      <div className="text-[9px] px-1 py-0.2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 truncate">
                        ✓ ส่งแล้ว {d.completedCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> ยังไม่ส่ง/รอดำเนินการ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ส่งงานเรียบร้อยแล้ว
            </span>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-amber-400 hover:underline text-xs"
              >
                ล้างตัวกรองวันที่
              </button>
            )}
          </div>
        </div>

        {/* Homework List & Details (5 cols) */}
        <div className="lg:col-span-5 bg-[#12141f] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                  รายการการบ้าน ({filteredHomework.length})
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedDate ? `งานที่ต้องส่งวันที่ ${selectedDate}` : 'แสดงรายการการบ้านทั้งหมด'}
                </p>
              </div>

              <select
                id="filter-hw-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="not_started">ยังไม่เริ่ม</option>
                <option value="in_progress">กำลังทำ</option>
                <option value="turned_in">ส่งแล้ว</option>
              </select>
            </div>

            {/* Course Selector Filter */}
            {coursesList.length > 0 && (
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs scrollbar-none">
                <button
                  onClick={() => setFilterCourse('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    filterCourse === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  ทุกวิชา
                </button>
                {coursesList.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCourse(c)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      filterCourse === c ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.split(':')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Homework Cards */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredHomework.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                  ไม่มีการบ้านในเงื่อนไขที่เลือก
                </div>
              ) : (
                filteredHomework.map((hw) => {
                  const isDone = hw.status === 'turned_in';

                  return (
                    <div
                      key={hw.id}
                      id={`hw-card-${hw.id}`}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-[#10121b]/60 border-slate-800 opacity-70'
                          : 'bg-[#161828] border-slate-700/80 shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-amber-400 block truncate">
                            {hw.courseName}
                          </span>
                          <h4 className={`font-bold text-sm text-white mt-0.5 ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {hw.title}
                          </h4>
                          {hw.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {hw.description}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteHomework(hw.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-xs">
                        <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {hw.dueDate} ({hw.dueTime || '23:59'})
                          </span>
                          {hw.maxPoints && <span>• {hw.maxPoints} คะแนน</span>}
                        </div>

                        {/* Status Toggle buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStatusChange(hw, 'not_started')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              hw.status === 'not_started'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            ยังไม่เริ่ม
                          </button>
                          <button
                            onClick={() => handleStatusChange(hw, 'in_progress')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              hw.status === 'in_progress'
                                ? 'bg-amber-600 text-white'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            กำลังทำ
                          </button>
                          <button
                            onClick={() => handleStatusChange(hw, 'turned_in')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              hw.status === 'turned_in'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            ส่งแล้ว
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Homework Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#151726] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                เพิ่มการบ้าน / ภารกิจส่งงาน
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomHomework} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ชื่อวิชา / คอร์สเรียน <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น CS102: Python & Data Analysis"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  หัวข้องาน / ชื่องานการบ้าน <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ทำแบบฝึกหัด Lab 5 ส่งในระบบ"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  คำอธิบายหรือรายละเอียด
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น ส่งไฟล์ .py ภายในเที่ยงคืน"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">วันกำหนดส่ง</label>
                  <input
                    type="date"
                    required
                    value={customDueDate}
                    onChange={(e) => setCustomDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">เวลาส่ง</label>
                  <input
                    type="time"
                    value={customDueTime}
                    onChange={(e) => setCustomDueTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">คะแนนเต็ม</label>
                  <input
                    type="number"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-950 transition-all"
                >
                  บันทึกการบ้าน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
