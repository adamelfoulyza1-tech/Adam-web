import React, { useState } from 'react';
import {
  Settings,
  Palette,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Shield,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { ThemeAccent, Task, ExpenseItem, HomeworkItem, UserProgress } from '../types';
import config from '../../firebase-applet-config.json';

interface SettingsViewProps {
  themeAccent: ThemeAccent;
  setThemeAccent: (theme: ThemeAccent) => void;
  tasks: Task[];
  expenses: ExpenseItem[];
  homework: HomeworkItem[];
  progress: UserProgress;
  onImportData: (data: { tasks?: Task[]; expenses?: ExpenseItem[]; homework?: HomeworkItem[]; progress?: UserProgress }) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeAccent,
  setThemeAccent,
  tasks,
  expenses,
  homework,
  progress,
  onImportData,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      expenses,
      homework,
      progress,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dailyquest_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportData(json);
        setImportStatus('นำเข้าและกู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว!');
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        setImportStatus('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-[#12141f] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          <span>CONFIGURATION & DATABASE STATUS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
          การตั้งค่า & ฐานข้อมูล Firebase
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          จัดการโทนสีของแอปพลิเคชัน ตรวจสอบสถานะการเชื่อมต่อ และสำรอง/กู้คืนข้อมูล
        </p>
      </div>

      {/* Theme Accent Settings */}
      <div className="bg-[#12141f] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-base">
          <Palette className="w-5 h-5 text-red-400" />
          <span>โทนสีและธีมของระบบ (Color Theme)</span>
        </div>
        <p className="text-xs text-slate-400">
          เลือกโทนสีไฮไลท์ตามที่คุณต้องการ (ดำ-แดง, ดำ-น้ำเงิน หรือ แดง-น้ำเงินคู่กัน)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Red Theme */}
          <button
            onClick={() => setThemeAccent('red')}
            className={`p-4 rounded-xl border text-left transition-all ${
              themeAccent === 'red'
                ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-950'
                : 'bg-[#151726] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 mb-3 shadow-md shadow-red-900/40"></div>
            <div className="font-bold text-sm text-white">โทนสีดำ - แดง (Crimson Red)</div>
            <div className="text-xs text-slate-400 mt-1">เน้นความดุดัน ชัดเจน สไตล์ Task Warrior</div>
          </button>

          {/* Blue Theme */}
          <button
            onClick={() => setThemeAccent('blue')}
            className={`p-4 rounded-xl border text-left transition-all ${
              themeAccent === 'blue'
                ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-950'
                : 'bg-[#151726] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 mb-3 shadow-md shadow-blue-900/40"></div>
            <div className="font-bold text-sm text-white">โทนสีดำ - น้ำเงิน (Neon Blue)</div>
            <div className="text-xs text-slate-400 mt-1">เน้นความสุขุม ทันสมัย สไตล์ Tech Analyst</div>
          </button>

          {/* Dual Theme */}
          <button
            onClick={() => setThemeAccent('dual')}
            className={`p-4 rounded-xl border text-left transition-all ${
              themeAccent === 'dual'
                ? 'bg-purple-950/40 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950'
                : 'bg-[#151726] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 mb-3 shadow-md shadow-purple-900/40"></div>
            <div className="font-bold text-sm text-white">โทนแดง - น้ำเงินคู่กัน (Cyber Duo)</div>
            <div className="text-xs text-slate-400 mt-1">ผสมผสานพลังความเร็วและความเฉียบคม</div>
          </button>
        </div>
      </div>

      {/* Firebase Database Status */}
      <div className="bg-[#12141f] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Database className="w-5 h-5 text-amber-400" />
            <span>สถานะฐานข้อมูล Firebase Firestore</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> เชื่อมต่อแล้ว (Connected)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-500">Firebase Project ID</div>
            <div className="font-mono font-bold text-slate-200 mt-0.5">{config.projectId}</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-500">Firestore Database ID</div>
            <div className="font-mono font-bold text-slate-200 mt-0.5">{config.firestoreDatabaseId || '(default)'}</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-500">จำนวน To-Do ในระบบ</div>
            <div className="font-bold text-slate-200 mt-0.5">{tasks.length} รายการ</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-500">จำนวนบันทึกรายรับ-รายจ่าย</div>
            <div className="font-bold text-slate-200 mt-0.5">{expenses.length} รายการ</div>
          </div>
        </div>
      </div>

      {/* Backup & Export / Import Data */}
      <div className="bg-[#12141f] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-base">
          <Download className="w-5 h-5 text-cyan-400" />
          <span>สำรองและกู้คืนข้อมูล (Backup & Restore)</span>
        </div>
        <p className="text-xs text-slate-400">
          ดาวน์โหลดข้อมูลทั้งหมดของคุณเก็บเป็นไฟล์ JSON หรือนำเข้าไฟล์ที่สำรองไว้
        </p>

        {importStatus && (
          <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl text-blue-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออกข้อมูล (Export JSON)</span>
          </button>

          <label className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition-colors shadow-md">
            <Upload className="w-4 h-4" />
            <span>นำเข้าข้อมูล (Import JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
