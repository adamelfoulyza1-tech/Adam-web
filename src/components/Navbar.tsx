import React from 'react';
import {
  CheckSquare,
  DollarSign,
  Calendar,
  Code,
  Settings,
  Flame,
  Zap,
  Cloud,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ActivePage, ThemeAccent, UserProgress } from '../types';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  themeAccent: ThemeAccent;
  setThemeAccent: (theme: ThemeAccent) => void;
  progress: UserProgress;
  pendingTasksCount: number;
  dueSoonHwCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  themeAccent,
  setThemeAccent,
  progress,
  pendingTasksCount,
  dueSoonHwCount,
}) => {
  const navItems: { id: ActivePage; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      id: 'tasks',
      label: 'To-Do ประจำวัน',
      icon: <CheckSquare className="w-5 h-5" />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'expenses',
      label: 'รายรับ - รายจ่าย',
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: 'classroom',
      label: 'การบ้าน Classroom',
      icon: <Calendar className="w-5 h-5" />,
      badge: dueSoonHwCount > 0 ? dueSoonHwCount : undefined,
      badgeColor: 'bg-amber-500 text-black font-bold animate-pulse',
    },
    {
      id: 'python',
      label: 'เรียน Python (W3Schools)',
      icon: <Code className="w-5 h-5" />,
      badge: progress.completedExerciseIds.length > 0 ? progress.completedExerciseIds.length : undefined,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'settings',
      label: 'ตั้งค่า & Firebase',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const getAccentClass = (isActive: boolean) => {
    if (!isActive) return 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';
    if (themeAccent === 'red') {
      return 'bg-red-600/20 text-red-400 border border-red-500/40 shadow-sm shadow-red-900/30';
    }
    if (themeAccent === 'blue') {
      return 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-900/30';
    }
    // dual theme
    return 'bg-gradient-to-r from-red-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-900/30';
  };

  const getLogoBadge = () => {
    if (themeAccent === 'red') return 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-red-600/30';
    if (themeAccent === 'blue') return 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-blue-600/30';
    return 'bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 text-white shadow-purple-600/40';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0c0e17]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActivePage('tasks')}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg ${getLogoBadge()}`}>
              ⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">DailyQuest</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  Firebase Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Tasks • Finance • Classroom • Python</p>
            </div>
          </div>

          {/* Center Navigation Tabs (Separated Pages) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {navItems.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative whitespace-nowrap ${getAccentClass(
                    active
                  )}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Widgets: XP & Theme Accent Selector */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* XP & Level Pill */}
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              onClick={() => setActivePage('python')}
              title="Python XP & Progress"
            >
              <div className="flex items-center text-amber-400 font-bold text-xs space-x-1">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{progress.totalXp} XP</span>
              </div>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-xs font-semibold text-slate-300">Lv.{progress.level}</span>
            </div>

            {/* Quick Accent Switcher */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl space-x-1">
              <button
                id="theme-red-btn"
                title="ธีมสีแดง (Crimson Red)"
                onClick={() => setThemeAccent('red')}
                className={`w-6 h-6 rounded-lg transition-transform ${
                  themeAccent === 'red' ? 'scale-110 ring-2 ring-red-400' : 'opacity-60 hover:opacity-100'
                } bg-red-600`}
              />
              <button
                id="theme-blue-btn"
                title="ธีมสีน้ำเงิน (Neon Blue)"
                onClick={() => setThemeAccent('blue')}
                className={`w-6 h-6 rounded-lg transition-transform ${
                  themeAccent === 'blue' ? 'scale-110 ring-2 ring-blue-400' : 'opacity-60 hover:opacity-100'
                } bg-blue-600`}
              />
              <button
                id="theme-dual-btn"
                title="ธีมแดง-น้ำเงิน (Cyberpunk Duo)"
                onClick={() => setThemeAccent('dual')}
                className={`w-6 h-6 rounded-lg transition-transform ${
                  themeAccent === 'dual' ? 'scale-110 ring-2 ring-cyan-400' : 'opacity-60 hover:opacity-100'
                } bg-gradient-to-tr from-red-600 via-purple-600 to-blue-600`}
              />
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2.5 space-x-2 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-btn-${item.id}`}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${getAccentClass(
                  active
                )}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
