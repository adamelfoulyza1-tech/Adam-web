import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TaskView } from './components/TaskView';
import { ExpenseView } from './components/ExpenseView';
import { ClassroomView } from './components/ClassroomView';
import { PythonView } from './components/PythonView';
import { SettingsView } from './components/SettingsView';
import {
  Task,
  ExpenseItem,
  HomeworkItem,
  UserProgress,
  ActivePage,
  ThemeAccent,
} from './types';
import {
  subscribeTasks,
  saveTask,
  removeTask,
  subscribeExpenses,
  saveExpense,
  removeExpense,
  subscribeHomework,
  saveHomework,
  saveBatchHomework,
  removeHomework,
  getProgress,
  saveProgress,
} from './services/firestoreService';
import { getSampleHomework } from './services/classroomService';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('tasks');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>(() => {
    return (localStorage.getItem('app_theme_accent') as ThemeAccent) || 'red';
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [progress, setProgress] = useState<UserProgress>({
    completedExerciseIds: [],
    totalXp: 0,
    level: 1,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    solvedCountByTopic: {},
  });

  // Handle Theme Accent Persist
  const handleSetThemeAccent = (theme: ThemeAccent) => {
    setThemeAccent(theme);
    localStorage.setItem('app_theme_accent', theme);
  };

  // Seed default data if completely empty on first run
  const initializeSeedData = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Seed sample tasks
    const initialTasks: Task[] = [
      {
        id: 'task_seed_1',
        title: 'ฝึกเขียนโค้ด Python เรื่อง List Comprehensions',
        description: 'แก้โจทย์ใน W3Schools Python Lab ให้ผ่านอย่างน้อย 3 ข้อ',
        date: today,
        time: '14:00',
        priority: 'high',
        category: 'coding',
        status: 'todo',
        subtasks: [
          { id: 'st_1', title: 'ทบทวนไวยากรณ์ for x in range()', completed: true },
          { id: 'st_2', title: 'ทำโจทย์ Squares of numbers', completed: false },
        ],
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
      },
      {
        id: 'task_seed_2',
        title: 'ตรวจสอบกำหนดส่งการบ้าน Google Classroom',
        description: 'เช็ค Assignment วิชา CS102 และ Discrete Math',
        date: today,
        time: '17:30',
        priority: 'medium',
        category: 'study',
        status: 'todo',
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now(),
      },
      {
        id: 'task_seed_3',
        title: 'บันทึกรายรับ-รายจ่ายและอัพโหลดสลิปโอนเงิน',
        description: 'รวมยอดค่าอาหารและค่าเดินทางประจำวัน',
        date: today,
        time: '20:00',
        priority: 'low',
        category: 'finance',
        status: 'completed',
        createdAt: Date.now() - 10800000,
        updatedAt: Date.now(),
      },
    ];

    // Seed sample expenses
    const initialExpenses: ExpenseItem[] = [
      {
        id: 'exp_seed_1',
        type: 'income',
        amount: 25000,
        category: 'salary',
        date: `${today.slice(0, 7)}-01`,
        time: '09:00',
        note: 'เงินเดือน & ค่าทำงานพิเศษ',
        createdAt: Date.now() - 86400000 * 10,
      },
      {
        id: 'exp_seed_2',
        type: 'expense',
        amount: 350,
        category: 'food',
        date: today,
        time: '12:30',
        note: 'มื้อกลางวัน ข้าวผัดกุ้ง + ชานม',
        createdAt: Date.now() - 3600000 * 2,
      },
      {
        id: 'exp_seed_3',
        type: 'expense',
        amount: 85,
        category: 'transport',
        date: today,
        time: '08:15',
        note: 'ค่ารถไฟฟ้า BTS ไปมหาวิทยาลัย',
        createdAt: Date.now() - 3600000 * 6,
      },
      {
        id: 'exp_seed_4',
        type: 'expense',
        amount: 1200,
        category: 'shopping',
        date: yesterday,
        time: '16:45',
        note: 'ซื้อหนังสือคู่มือ Python และเครื่องเขียน',
        createdAt: Date.now() - 86400000,
      },
      {
        id: 'exp_seed_5',
        type: 'expense',
        amount: 3500,
        category: 'bills',
        date: `${today.slice(0, 7)}-05`,
        time: '11:00',
        note: 'ค่าอินเทอร์เน็ตและค่าน้ำไฟหอพัก',
        createdAt: Date.now() - 86400000 * 5,
      },
    ];

    initialTasks.forEach(saveTask);
    initialExpenses.forEach(saveExpense);
    saveBatchHomework(getSampleHomework());
  };

  // Subscribe to Firestore Realtime Updates
  useEffect(() => {
    const unsubTasks = subscribeTasks((loadedTasks) => {
      if (loadedTasks.length === 0 && !localStorage.getItem('seed_initialized')) {
        localStorage.setItem('seed_initialized', 'true');
        initializeSeedData();
      } else {
        setTasks(loadedTasks);
      }
    });

    const unsubExpenses = subscribeExpenses((loadedExp) => {
      setExpenses(loadedExp);
    });

    const unsubHomework = subscribeHomework((loadedHw) => {
      setHomeworkList(loadedHw);
    });

    getProgress().then((p) => {
      setProgress(p);
    });

    return () => {
      unsubTasks();
      unsubExpenses();
      unsubHomework();
    };
  }, []);

  // Update Python progress handler
  const handleUpdateProgress = (newProg: UserProgress) => {
    setProgress(newProg);
    saveProgress(newProg);
  };

  // Import JSON handler
  const handleImportData = (data: {
    tasks?: Task[];
    expenses?: ExpenseItem[];
    homework?: HomeworkItem[];
    progress?: UserProgress;
  }) => {
    if (data.tasks) {
      data.tasks.forEach(saveTask);
    }
    if (data.expenses) {
      data.expenses.forEach(saveExpense);
    }
    if (data.homework) {
      saveBatchHomework(data.homework);
    }
    if (data.progress) {
      handleUpdateProgress(data.progress);
    }
  };

  // Compute badges for Navbar
  const pendingTasksCount = tasks.filter(
    (t) => t.date === new Date().toISOString().split('T')[0] && t.status !== 'completed'
  ).length;

  const dueSoonHwCount = homeworkList.filter((h) => {
    if (h.status === 'turned_in') return false;
    const dueTimestamp = new Date(`${h.dueDate}T${h.dueTime || '23:59'}:00`).getTime();
    const diffHours = (dueTimestamp - Date.now()) / (1000 * 60 * 60);
    return diffHours <= 48;
  }).length;

  return (
    <div
      className={`min-h-screen bg-[#090a10] text-slate-100 selection:bg-red-500/30 selection:text-white flex flex-col font-sans`}
    >
      {/* Dynamic Background Glows based on Theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {themeAccent === 'red' && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px]" />
          </>
        )}
        {themeAccent === 'blue' && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
          </>
        )}
        {themeAccent === 'dual' && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
          </>
        )}
      </div>

      {/* Main Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        themeAccent={themeAccent}
        setThemeAccent={handleSetThemeAccent}
        progress={progress}
        pendingTasksCount={pendingTasksCount}
        dueSoonHwCount={dueSoonHwCount}
      />

      {/* Main Content Area - Separated Views per User Request */}
      <main className="flex-1 relative z-10 pb-16">
        {activePage === 'tasks' && (
          <TaskView
            tasks={tasks}
            onSaveTask={saveTask}
            onDeleteTask={removeTask}
            themeAccent={themeAccent}
          />
        )}

        {activePage === 'expenses' && (
          <ExpenseView
            expenses={expenses}
            onSaveExpense={saveExpense}
            onDeleteExpense={removeExpense}
            themeAccent={themeAccent}
          />
        )}

        {activePage === 'classroom' && (
          <ClassroomView
            homeworkList={homeworkList}
            onSaveHomework={saveHomework}
            onBatchSaveHomework={saveBatchHomework}
            onDeleteHomework={removeHomework}
            themeAccent={themeAccent}
          />
        )}

        {activePage === 'python' && (
          <PythonView
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            themeAccent={themeAccent}
          />
        )}

        {activePage === 'settings' && (
          <SettingsView
            themeAccent={themeAccent}
            setThemeAccent={handleSetThemeAccent}
            tasks={tasks}
            expenses={expenses}
            homework={homeworkList}
            progress={progress}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c0e17] py-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Firebase Firestore Live Connected</span>
          </div>
          <div>DailyQuest • To-Do, Finance, Classroom & W3Schools Python Hub</div>
        </div>
      </footer>
    </div>
  );
}
