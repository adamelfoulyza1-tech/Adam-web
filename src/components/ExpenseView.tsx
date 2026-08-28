import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Image as ImageIcon,
  Upload,
  Calendar,
  Filter,
  PieChart as PieIcon,
  BarChart3,
  Trash2,
  Eye,
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Maximize2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { ExpenseItem, ExpenseType, ExpenseCategory, ThemeAccent } from '../types';

interface ExpenseViewProps {
  expenses: ExpenseItem[];
  onSaveExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  themeAccent: ThemeAccent;
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  food: { label: 'อาหาร & เครื่องดื่ม', icon: '🍲', color: '#f97316' },
  transport: { label: 'เดินทาง & น้ำมัน', icon: '🚗', color: '#3b82f6' },
  shopping: { label: 'ช้อปปิ้ง & ของใช้', icon: '🛍️', color: '#ec4899' },
  bills: { label: 'ค่าหอพัก & ค่าน้ำไฟ', icon: '🏠', color: '#8b5cf6' },
  education: { label: 'การศึกษา & อุปกรณ์', icon: '📚', color: '#06b6d4' },
  entertainment: { label: 'บันเทิง & สตรีมมิ่ง', icon: '🎮', color: '#10b981' },
  salary: { label: 'เงินเดือน & ค่าจ้าง', icon: '💵', color: '#22c55e' },
  freelance: { label: 'ฟรีแลนซ์ & งานเสริม', icon: '💻', color: '#14b8a6' },
  investment: { label: 'ลงทุน & ดอกเบี้ย', icon: '📈', color: '#eab308' },
  gift: { label: 'ของขวัญ & โบนัส', icon: '🎁', color: '#f43f5e' },
  other: { label: 'อื่นๆ ทั่วไป', icon: '📌', color: '#64748b' },
};

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  expenses,
  onSaveExpense,
  onDeleteExpense,
  themeAccent,
}) => {
  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<ExpenseType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('12:00');
  const [note, setNote] = useState<string>('');
  const [slipBase64, setSlipBase64] = useState<string | undefined>(undefined);
  const [slipName, setSlipName] = useState<string | undefined>(undefined);

  // Handle Slip File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB for good performance & base64 storage)
    if (file.size > 3 * 1024 * 1024) {
      alert('รูปภาพสลิปมีขนาดใหญ่เกิน 3MB โปรดเลือกรูปที่มีขนาดเล็กลง');
      return;
    }

    setSlipName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSlipBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSlipName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSlipBase64(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory('food');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('12:00');
    setNote('');
    setSlipBase64(undefined);
    setSlipName(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }

    const newItem: ExpenseItem = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      amount: parsedAmount,
      category,
      date,
      time,
      note: note.trim() || undefined,
      slipImage: slipBase64,
      slipImageName: slipName,
      createdAt: Date.now(),
    };

    onSaveExpense(newItem);
    resetForm();
    setIsModalOpen(false);
  };

  // Filtered by month
  const monthExpenses = useMemo(() => {
    return expenses.filter((item) => item.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  // Overall calculations for the selected month
  const { totalIncome, totalExpense, balance, savingsRate } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    monthExpenses.forEach((item) => {
      if (item.type === 'income') inc += item.amount;
      else exp += item.amount;
    });
    const bal = inc - exp;
    const rate = inc > 0 ? Math.max(0, Math.round((bal / inc) * 100)) : 0;
    return { totalIncome: inc, totalExpense: exp, balance: bal, savingsRate: rate };
  }, [monthExpenses]);

  // Daily Chart Data for Selected Month
  const dailyChartData = useMemo(() => {
    const map: Record<string, { day: string; income: number; expense: number }> = {};
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${selectedMonth}-${dayStr}`;
      map[dateKey] = { day: `${d}`, income: 0, expense: 0 };
    }

    monthExpenses.forEach((item) => {
      if (map[item.date]) {
        if (item.type === 'income') {
          map[item.date].income += item.amount;
        } else {
          map[item.date].expense += item.amount;
        }
      }
    });

    return Object.values(map);
  }, [monthExpenses, selectedMonth]);

  // Category Pie Chart Data for Expenses
  const categoryPieData = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        map[item.category] = (map[item.category] || 0) + item.amount;
      });

    return Object.entries(map).map(([cat, total]) => ({
      name: CATEGORY_MAP[cat as ExpenseCategory]?.label || cat,
      value: total,
      color: CATEGORY_MAP[cat as ExpenseCategory]?.color || '#64748b',
    }));
  }, [monthExpenses]);

  // Table items with filters
  const filteredTableItems = useMemo(() => {
    return monthExpenses.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      return true;
    });
  }, [monthExpenses, filterType, filterCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card with Month Selector & Quick Action */}
      <div className="bg-[#12141f] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>EXPENSE TRACKER & MONTHLY ANALYTICS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              ระบบรายรับ - รายจ่าย & กราฟวิเคราะห์
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              บันทึกธุรกรรม อัพโหลดสลิปโอนเงิน สรุปผลรายเดือน และดูกราฟแนวโน้มการเงิน
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <input
                id="expense-month-picker"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              id="btn-add-expense"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-950 transition-transform active:scale-95 ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกรายรับ/รายจ่าย</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary Cards (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-800/80">
          {/* Total Income */}
          <div className="bg-[#181a28] rounded-xl p-4 border border-emerald-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>รายรับรวม (Income)</span>
              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              +{totalIncome.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span>
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> เดือน {selectedMonth}
            </div>
          </div>

          {/* Total Expense */}
          <div className="bg-[#181a28] rounded-xl p-4 border border-red-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-red-400 text-xs font-semibold">
              <span>รายจ่ายรวม (Expense)</span>
              <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-800/60">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              -{totalExpense.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span>
            </div>
            <div className="text-[11px] text-red-400/80 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> รวมทุกหมวดหมู่
            </div>
          </div>

          {/* Net Balance */}
          <div className={`bg-[#181a28] rounded-xl p-4 border ${balance >= 0 ? 'border-cyan-900/40' : 'border-rose-900/50'} relative overflow-hidden`}>
            <div className="flex items-center justify-between text-cyan-400 text-xs font-semibold">
              <span>คงเหลือสุทธิ (Net Balance)</span>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-black mt-2 ${balance >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
              {balance >= 0 ? `+${balance.toLocaleString()}` : `${balance.toLocaleString()}`}{' '}
              <span className="text-xs text-slate-400 font-normal">บาท</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {balance >= 0 ? 'งบการเงินเป็นบวก' : 'รายจ่ายเกินรายรับ'}
            </div>
          </div>

          {/* Savings Rate */}
          <div className="bg-[#181a28] rounded-xl p-4 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
              <span>อัตราการออมเงิน (Savings)</span>
              <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/60">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {savingsRate}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-[#12141f] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                กราฟรายรับ - รายจ่าย รายวัน (Daily Breakdown)
              </h3>
              <p className="text-xs text-slate-400">เปรียบเทียบการเงินในแต่ละวันของเดือน {selectedMonth}</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span> รายรับ
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-3 h-3 rounded-sm bg-red-500 inline-block"></span> รายจ่าย
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f111a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} บาท`]}
                />
                <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Donut Chart (1 Col) */}
        <div className="bg-[#12141f] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" />
              สัดส่วนรายจ่ายตามหมวดหมู่
            </h3>
            <p className="text-xs text-slate-400">วิเคราะห์ค่าใช้จ่ายของเดือน {selectedMonth}</p>
          </div>

          {categoryPieData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-500 text-xs">
              <div className="text-3xl mb-2">📊</div>
              ยังไม่มีข้อมูลรายจ่ายในเดือนนี้
            </div>
          ) : (
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} บาท`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400">รวมรายจ่าย</span>
                <span className="text-sm font-bold text-white">฿{totalExpense.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Mini Category Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto scrollbar-none">
            {categoryPieData.map((cat, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-md border border-slate-700 bg-slate-900 flex items-center gap-1 text-slate-300"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                {cat.name} ({Math.round((cat.value / (totalExpense || 1)) * 100)}%)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History & Slip Gallery */}
      <div className="bg-[#12141f] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              ประวัติรายการ & รูปสลิปการโอนเงิน
            </h3>
            <p className="text-xs text-slate-400">
              แสดงทั้งหมด {filteredTableItems.length} รายการในเดือน {selectedMonth}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
              <button
                id="filter-exp-all"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                id="filter-exp-income"
                onClick={() => setFilterType('income')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterType === 'income' ? 'bg-emerald-800/70 text-emerald-200' : 'text-slate-400'
                }`}
              >
                รายรับ
              </button>
              <button
                id="filter-exp-expense"
                onClick={() => setFilterType('expense')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterType === 'expense' ? 'bg-red-800/70 text-red-200' : 'text-slate-400'
                }`}
              >
                รายจ่าย
              </button>
            </div>

            <select
              id="filter-exp-category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icon} {info.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transaction Table / Card List */}
        {filteredTableItems.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            ไม่มีรายการรายรับ-รายจ่ายที่ตรงกับเงื่อนไขในเดือนนี้
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTableItems.map((item) => {
              const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
              const isIncome = item.type === 'income';

              return (
                <div
                  key={item.id}
                  id={`expense-row-${item.id}`}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${
                        isIncome
                          ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                          : 'bg-red-950/60 border-red-800/60 text-red-400'
                      }`}
                    >
                      {catInfo.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-white truncate">
                          {catInfo.label}
                        </span>
                        {item.note && (
                          <span className="text-xs text-slate-400 truncate max-w-xs">
                            - {item.note}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5">
                        <span>{item.date}</span>
                        {item.time && <span>{item.time} น.</span>}
                        {item.slipImage && (
                          <span className="text-cyan-400 font-semibold flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> มีสลิปแนบ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold ${
                          isIncome ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isIncome ? `+${item.amount.toLocaleString()}` : `-${item.amount.toLocaleString()}`}{' '}
                        <span className="text-xs font-normal text-slate-400">บาท</span>
                      </div>
                    </div>

                    {/* View Slip Button */}
                    {item.slipImage ? (
                      <button
                        id={`btn-view-slip-${item.id}`}
                        onClick={() => setViewingSlipUrl(item.slipImage!)}
                        className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 transition-colors"
                        title="ดูรูปสลิป"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-7"></div>
                    )}

                    {/* Delete button */}
                    <button
                      id={`btn-delete-exp-${item.id}`}
                      onClick={() => onDeleteExpense(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="ลบรายการ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slip Preview Modal */}
      {viewingSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#151726] border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                รูปสลิปการโอนเงิน (Transfer Slip)
              </h3>
              <button
                onClick={() => setViewingSlipUrl(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center justify-center bg-slate-950">
              <img
                src={viewingSlipUrl}
                alt="สลิปการโอนเงิน"
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg border border-slate-800"
              />
            </div>
            <div className="px-5 py-3 bg-[#11131f] border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingSlipUrl(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense / Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#151726] border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#151726] z-10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                บันทึกรายการรายรับ - รายจ่าย
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Switcher (Income vs Expense) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-700 rounded-xl">
                <button
                  type="button"
                  id="modal-select-expense"
                  onClick={() => {
                    setType('expense');
                    setCategory('food');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'expense'
                      ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔻 รายจ่าย (Expense)
                </button>
                <button
                  type="button"
                  id="modal-select-income"
                  onClick={() => {
                    setType('income');
                    setCategory('salary');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔺 รายรับ (Income)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  จำนวนเงิน (บาท) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">฿</span>
                  <input
                    id="input-exp-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-base font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  หมวดหมู่ <span className="text-red-400">*</span>
                </label>
                <select
                  id="select-exp-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {Object.entries(CATEGORY_MAP)
                    .filter(([k]) => {
                      if (type === 'income') {
                        return ['salary', 'freelance', 'investment', 'gift', 'other'].includes(k);
                      }
                      return ['food', 'transport', 'shopping', 'bills', 'education', 'entertainment', 'other'].includes(k);
                    })
                    .map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.icon} {info.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">วันที่</label>
                  <input
                    id="input-exp-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">เวลา</label>
                  <input
                    id="input-exp-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  หมายเหตุ / โน้ต
                </label>
                <input
                  id="input-exp-note"
                  type="text"
                  placeholder="เช่น ข้าวกลางวัน, ค่าหนังสือสอบ, เงินเดือนก้อนแรก"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Slip Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  อัพโหลดรูปสลิปการโอนเงิน (Slip Upload)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-xl p-4 text-center bg-slate-900/50 cursor-pointer transition-colors relative"
                >
                  <input
                    id="input-slip-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />

                  {slipBase64 ? (
                    <div className="flex items-center space-x-3">
                      <img
                        src={slipBase64}
                        alt="Slip thumbnail"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-bold text-cyan-400 truncate">{slipName || 'สลิปโอนเงิน'}</p>
                        <p className="text-[10px] text-slate-400">คลิกหรือลากไฟล์ใหม่เพื่อเปลี่ยนรูป</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlipBase64(undefined);
                          setSlipName(undefined);
                        }}
                        className="text-slate-400 hover:text-red-400 text-xs p-1"
                      >
                        ลบรูป
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-300">
                        คลิกเพื่อเลือกรูปสลิป หรือลากไฟล์มาวางที่นี่
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">รองรับ JPG, PNG, WEBP (สูงสุด 3MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-submit-expense"
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-950 transition-all"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
