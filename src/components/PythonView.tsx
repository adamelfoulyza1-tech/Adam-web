import React, { useState, useEffect } from 'react';
import {
  Code,
  Play,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Award,
  Flame,
  Zap,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Terminal,
  Search,
  Filter,
  Check,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PythonExercise, PythonDifficulty, UserProgress, ThemeAccent } from '../types';
import { W3SCHOOLS_TOPICS, PYTHON_EXERCISES } from '../data/w3schoolsExercises';
import { runPythonCode, ExecutionResult } from '../services/pythonRunner';

interface PythonViewProps {
  progress: UserProgress;
  onUpdateProgress: (progress: UserProgress) => void;
  themeAccent: ThemeAccent;
}

export const PythonView: React.FC<PythonViewProps> = ({
  progress,
  onUpdateProgress,
  themeAccent,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [userCode, setUserCode] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showHintIndex, setShowHintIndex] = useState<number>(-1);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // Filter exercises
  const filteredExercises = PYTHON_EXERCISES.filter((ex) => {
    if (selectedTopic !== 'all' && ex.topic !== selectedTopic) return false;
    if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ex.title.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q) ||
        ex.topicName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentExercise: PythonExercise | undefined =
    filteredExercises[activeExerciseIndex] || PYTHON_EXERCISES[0];

  // Sync userCode when current exercise changes
  useEffect(() => {
    if (currentExercise) {
      setUserCode(currentExercise.initialCode);
      setExecutionResult(null);
      setShowHintIndex(-1);
      setShowSolution(false);
    }
  }, [currentExercise?.id]);

  const handleRunCode = () => {
    if (!currentExercise) return;
    setIsRunning(true);
    setTimeout(() => {
      const res = runPythonCode(userCode, currentExercise);
      setExecutionResult(res);
      setIsRunning(false);
    }, 150);
  };

  const handleSubmitSolution = () => {
    if (!currentExercise) return;
    setIsRunning(true);

    setTimeout(() => {
      const res = runPythonCode(userCode, currentExercise);
      setExecutionResult(res);
      setIsRunning(false);

      if (res.isCorrect) {
        // Confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'],
        });

        // Award XP and update progress if not already completed
        const isNew = !progress.completedExerciseIds.includes(currentExercise.id);
        if (isNew) {
          const xpGain = currentExercise.difficulty === 'easy' ? 30 : currentExercise.difficulty === 'medium' ? 50 : 80;
          const updatedCompleted = [...progress.completedExerciseIds, currentExercise.id];
          const newXp = progress.totalXp + xpGain;
          const newLevel = Math.floor(newXp / 150) + 1;

          const updatedProgress: UserProgress = {
            ...progress,
            completedExerciseIds: updatedCompleted,
            totalXp: newXp,
            level: newLevel,
            lastActiveDate: new Date().toISOString().split('T')[0],
            solvedCountByTopic: {
              ...progress.solvedCountByTopic,
              [currentExercise.topic]: (progress.solvedCountByTopic[currentExercise.topic] || 0) + 1,
            },
          };
          onUpdateProgress(updatedProgress);
        }
      }
    }, 200);
  };

  const resetCode = () => {
    if (currentExercise) {
      setUserCode(currentExercise.initialCode);
      setExecutionResult(null);
    }
  };

  const getDifficultyBadge = (d: PythonDifficulty) => {
    switch (d) {
      case 'easy':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">Easy (ง่าย)</span>;
      case 'medium':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">Medium (ปานกลาง)</span>;
      case 'hard':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400">Hard (ยาก)</span>;
      case 'expert':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">Expert (เชี่ยวชาญ)</span>;
    }
  };

  const completedCount = progress.completedExerciseIds.length;
  const totalExercisesCount = PYTHON_EXERCISES.length;
  const percentCompleted = Math.round((completedCount / totalExercisesCount) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner with XP, Level & Stats */}
      <div className="bg-[#12141f] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>W3SCHOOLS PYTHON LEARNING & LAB HUB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-center gap-2">
              🐍 ศูนย์เรียนรู้ Python (W3Schools)
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              รวมโจทย์ตามหลักสูตร W3Schools ครบทุกหัวข้อจากง่ายไปยาก พร้อมตัวรันและตรวจโค้ดแบบเรียลไทม์
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                  <Flame className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Total XP</div>
                  <div className="text-sm font-extrabold text-amber-400">{progress.totalXp} XP</div>
                </div>
              </div>

              <div className="w-px h-7 bg-slate-800" />

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">ระดับผู้เรียน</div>
                  <div className="text-sm font-extrabold text-white">Level {progress.level}</div>
                </div>
              </div>

              <div className="w-px h-7 bg-slate-800" />

              <div>
                <div className="text-[10px] text-slate-400">ผ่านแล้ว</div>
                <div className="text-sm font-extrabold text-emerald-400">
                  {completedCount} / {totalExercisesCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>ความคืบหน้าหลักสูตร W3Schools ทั้งหมด</span>
            <span className="font-bold text-cyan-400">{percentCompleted}% สำเร็จ</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Coding Workspace Grid: Left Sidebar Topics/Exercises (4 cols), Right Code Editor & Runner (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Topics & Exercise Explorer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filters & Search */}
          <div className="bg-[#12141f] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-python-ex"
                type="text"
                placeholder="ค้นหาโจทย์ หรือหัวข้อ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                id="select-py-topic"
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setActiveExerciseIndex(0);
                }}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none truncate"
              >
                {W3SCHOOLS_TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name}
                  </option>
                ))}
              </select>

              <select
                id="select-py-diff"
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setActiveExerciseIndex(0);
                }}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="all">ทุกระดับความยาก</option>
                <option value="easy">Easy (ง่าย)</option>
                <option value="medium">Medium (ปานกลาง)</option>
                <option value="hard">Hard (ยาก)</option>
              </select>
            </div>
          </div>

          {/* Exercise List */}
          <div className="bg-[#12141f] border border-slate-800 rounded-2xl p-3 shadow-lg space-y-2 max-h-[580px] overflow-y-auto pr-1">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
              <span>รายการโจทย์ ({filteredExercises.length})</span>
            </div>

            {filteredExercises.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                ไม่พบโจทย์ที่ตรงกับตัวกรอง
              </div>
            ) : (
              filteredExercises.map((ex, idx) => {
                const isSelected = activeExerciseIndex === idx;
                const isCompleted = progress.completedExerciseIds.includes(ex.id);

                return (
                  <button
                    key={ex.id}
                    id={`btn-select-ex-${ex.id}`}
                    onClick={() => setActiveExerciseIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                        : 'bg-[#151726] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold text-slate-400">{ex.topicName}</span>
                        {getDifficultyBadge(ex.difficulty)}
                      </div>
                      <h4 className="font-bold text-xs text-white truncate mt-1">{ex.title}</h4>
                    </div>

                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center text-xs font-bold" title="ผ่านแล้ว">
                          ✓
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Code Challenge & Terminal Runner (8 cols) */}
        {currentExercise && (
          <div className="lg:col-span-8 space-y-4">
            {/* Exercise Problem Description Card */}
            <div className="bg-[#12141f] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800/60">
                    {currentExercise.topicName}
                  </span>
                  {getDifficultyBadge(currentExercise.difficulty)}
                  {progress.completedExerciseIds.includes(currentExercise.id) && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านแล้ว (+XP)
                    </span>
                  )}
                </div>

                <a
                  href={currentExercise.w3schoolsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>ดูทฤษฎี W3Schools</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <h2 className="text-lg font-black text-white">{currentExercise.title}</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#161828] p-3.5 rounded-xl border border-slate-800">
                {currentExercise.description}
              </p>

              {currentExercise.expectedOutput && (
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 font-sans font-bold">ผลลัพธ์ที่คาดหวัง:</span>
                  <span className="text-emerald-300 font-bold">{currentExercise.expectedOutput}</span>
                </div>
              )}
            </div>

            {/* Code Editor Box */}
            <div className="bg-[#12141f] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#181a28] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 ml-2">solution.py</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    id="btn-reset-code"
                    onClick={resetCode}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs flex items-center gap-1"
                    title="คืนค่าโค้ดเริ่มต้น"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Textarea Code Input */}
              <div className="relative">
                <textarea
                  id="python-code-textarea"
                  rows={8}
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder="# เขียนโค้ด Python ที่นี่..."
                  spellCheck={false}
                  className="w-full bg-[#0d0f17] text-cyan-300 font-mono text-xs sm:text-sm p-4 focus:outline-none resize-y selection:bg-blue-600/40 leading-relaxed border-none"
                />
              </div>

              {/* Action Buttons Toolbar */}
              <div className="bg-[#151726] px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    id="btn-show-hint"
                    onClick={() => {
                      if (showHintIndex < currentExercise.hints.length - 1) {
                        setShowHintIndex(showHintIndex + 1);
                      } else {
                        setShowHintIndex(-1);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 transition-colors flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>คำใบ้ {showHintIndex >= 0 ? `(${showHintIndex + 1}/${currentExercise.hints.length})` : ''}</span>
                  </button>

                  <button
                    id="btn-show-solution"
                    onClick={() => setShowSolution(!showSolution)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    {showSolution ? 'ซ่อนเฉลย' : 'ดูเฉลย W3Schools'}
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    id="btn-run-code"
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                    <span>{isRunning ? 'กำลังรัน...' : 'รันโค้ด (Run)'}</span>
                  </button>

                  <button
                    id="btn-submit-solution"
                    onClick={handleSubmitSolution}
                    disabled={isRunning}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 shadow-lg shadow-red-950 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>ตรวจคำตอบ & รับ XP</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hint Box (If active) */}
            {showHintIndex >= 0 && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-800 rounded-xl text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-amber-300">
                    คำใบ้ที่ {showHintIndex + 1}:
                  </span>{' '}
                  {currentExercise.hints[showHintIndex]}
                </div>
              </div>
            )}

            {/* Solution Box (If active) */}
            {showSolution && (
              <div className="p-4 bg-[#141624] border border-blue-800/80 rounded-xl text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-blue-300 font-bold">
                  <span>💡 เฉลยและคำอธิบาย (W3Schools):</span>
                  <button
                    onClick={() => setUserCode(currentExercise.solution)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    วางโค้ดเฉลยลงใน Editor
                  </button>
                </div>
                <pre className="bg-[#090a10] p-3 rounded-lg text-emerald-300 font-mono overflow-x-auto">
                  {currentExercise.solution}
                </pre>
                <p className="text-slate-300 leading-relaxed">{currentExercise.explanation}</p>
              </div>
            )}

            {/* Terminal Output & Test Results */}
            {executionResult && (
              <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 font-bold">Terminal Output</span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="text-slate-500">{executionResult.executionTimeMs}ms</span>
                    {executionResult.isCorrect ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        ✓ ถูกต้อง (Passed)
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                        ✗ ยังไม่ถูกต้อง
                      </span>
                    )}
                  </div>
                </div>

                {/* Output content */}
                <div className="text-xs pt-1">
                  {executionResult.error ? (
                    <div className="text-red-400 whitespace-pre-wrap">{executionResult.error}</div>
                  ) : (
                    <div className="text-slate-200 whitespace-pre-wrap">
                      {executionResult.output}
                    </div>
                  )}
                </div>

                {/* Feedback message */}
                {executionResult.feedback && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg text-xs font-sans font-medium ${
                      executionResult.isCorrect
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
                    }`}
                  >
                    {executionResult.feedback}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
