import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  TrendingUp, 
  History, 
  Moon, 
  Sun, 
  Plus, 
  Trash2, 
  Copy, 
  Share2, 
  FileImage, 
  FileText,
  RotateCcw,
  Calculator,
  Play,
  BarChart3,
  Bookmark,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StepRow {
  step: number;
  amount: number;
  win: number;
  cumulative: number;
  profit: number;
}

interface HistoryItem {
  id: string;
  amount: number;
  steps: number;
  date: string;
}

interface Preset {
  id: string;
  name: string;
  amount: number;
  steps: number;
}

export default function App() {
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [stepCount, setStepCount] = useState<number | ''>('');
  const [winMultiplier] = useState<number>(1.96);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showError, setShowError] = useState(false);
  const [chartType, setChartType] = useState<'Bar' | 'Line' | 'Area'>('Bar');
  const [notes, setNotes] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('eip_history');
    const savedPresets = localStorage.getItem('eip_presets');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedPresets) setPresets(JSON.parse(savedPresets));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('eip_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('eip_presets', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const calculatedSteps = useMemo(() => {
    if (totalAmount === '' || stepCount === '' || totalAmount <= 0 || stepCount <= 0) return [];
    
    const rows: StepRow[] = [];
    const n = stepCount;
    let cumulative = 0;
    const base = 2; 
    let sumWeights = 0;
    for (let i = 0; i < n; i++) sumWeights += Math.pow(base, i);
    
    const firstStep = totalAmount / sumWeights;

    for (let i = 1; i <= n; i++) {
      const amount = firstStep * Math.pow(base, i - 1);
      const currentAmount = Number(amount.toFixed(6));
      cumulative += currentAmount;
      const win = currentAmount * winMultiplier;
      const profit = win - cumulative;
      
      rows.push({
        step: i,
        amount: currentAmount,
        win: Number(win.toFixed(6)),
        cumulative: Number(cumulative.toFixed(6)),
        profit: Number(profit.toFixed(6))
      });
    }
    return rows;
  }, [totalAmount, stepCount, winMultiplier]);

  const handleCalculate = () => {
    if (totalAmount === '' || stepCount === '') {
      setShowError(true);
      setIsCalculated(false);
      return;
    }
    setShowError(false);
    setIsCalculated(true);
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      amount: Number(totalAmount),
      steps: Number(stepCount),
      date: new Date().toLocaleString('bn-BD', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true 
      })
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setTotalAmount(item.amount);
    setStepCount(item.steps);
    setShowHistory(false);
    setIsCalculated(true);
    // Smooth scroll to results
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const savePreset = () => {
    if (totalAmount === '' || stepCount === '') return;
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: `P ${presets.length + 1}`,
      amount: Number(totalAmount),
      steps: Number(stepCount)
    };
    setPresets(prev => [...prev, newPreset]);
  };

  const reset = () => {
    setTotalAmount('');
    setStepCount('');
    setIsCalculated(false);
    setShowError(false);
  };

  const handleCopy = () => {
    if (calculatedSteps.length === 0) return;
    const text = calculatedSteps.map(s => 
      `Step ${s.step}: ৳${s.amount.toFixed(2)} | Win: ৳${s.win.toFixed(2)} | Cumulative: ৳${s.cumulative.toFixed(2)} | Profit: +৳${s.profit.toFixed(2)}`
    ).join('\n');
    navigator.clipboard.writeText(`TRADER TAMIM STEP - Results:\nTotal: ৳${totalAmount}\n${text}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TRADER TAMIM STEP',
          text: `ট্রেডিং ক্যালকুলেশন: মোট ৳${totalAmount}, ${stepCount} টি স্টেপ।`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadPNG = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: '#0f172a',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `trader-tamim-step-calculation-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: '#0f172a',
      scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`trader-tamim-step-calculation-${Date.now()}.pdf`);
  };

  return (
    <div className={cn(
      "min-h-screen transition-all duration-300 font-sans", 
      isDarkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900"
    )}>
      <div ref={containerRef} className={cn(
        "pb-12 w-full transition-colors duration-300",
        isDarkMode ? "bg-slate-950" : "bg-white"
      )}>
        {/* Header */}
        <header className={cn(
          "px-5 py-4 flex items-center sticky top-0 z-[50] border-b transition-colors duration-300",
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
        )}>
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden border border-slate-100 shrink-0">
                 <img src="https://i.ibb.co.com/TDgjj2m7/20260211-163626.jpg" alt="TRADER TAMIM" className="size-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex items-center">
                <h1 className={cn(
                  "font-black text-[13px] whitespace-nowrap tracking-tight",
                  isDarkMode ? "text-white" : "text-slate-800"
                )}>TRADER TAMIM STEP</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 ml-auto">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn(
                  "size-8 rounded-full border flex items-center justify-center shadow-sm transition-all active:scale-90",
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-600"
                )}
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button 
                onClick={() => setShowHistory(true)}
                className={cn(
                  "h-8 px-3 rounded-full border flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-[11px] font-bold",
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-600"
                )}
              >
                <History size={14} />
                <span className="hidden sm:inline">History</span>
                {history.length > 0 && (
                  <span className="flex items-center justify-center size-4 bg-blue-500 text-white rounded-full text-[9px] font-black">{history.length}</span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Full Screen History Sidebar/Drawer */}
        <AnimatePresence>
          {showHistory && (
            <>
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200]"
              />
              
              {/* Drawer Content */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={cn(
                  "fixed right-0 top-0 bottom-0 w-full max-w-[400px] z-[210] p-6 flex flex-col shadow-2xl border-l transition-colors",
                  isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"
                )}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowHistory(false)}
                      className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-colors",
                        isDarkMode ? "bg-slate-800 text-white/70 hover:bg-slate-700" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      <Plus className="rotate-45" size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                       <span className="text-2xl">📜</span>
                       <h2 className={cn(
                         "text-[20px] font-bold",
                         isDarkMode ? "text-white/90" : "text-slate-800"
                       )}>History</h2>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setHistory([])}
                    className="flex items-center gap-1.5 text-rose-500 font-bold text-[14px] hover:opacity-80 transition-opacity"
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                       <History size={48} className="mb-4 opacity-20" />
                       <p className="font-bold">মেইজে কিছু নেই</p>
                    </div>
                  ) : (
                    history.map(item => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => loadHistoryItem(item)}
                        className={cn(
                          "p-5 rounded-[1.2rem] cursor-pointer transition-all group relative border shadow-sm",
                          isDarkMode ? "bg-slate-900/50 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                        )}
                      >
                        <div className={cn(
                          "text-[15px] font-black",
                          isDarkMode ? "text-slate-200" : "text-slate-800"
                        )}>
                          Amount: {item.amount} × {item.steps} Steps
                        </div>
                        <div className={cn(
                          "text-[11px] font-bold mt-1",
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        )}>
                          Total: {item.amount} • {item.date}
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setHistory(prev => prev.filter(i => i.id !== item.id)); 
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Presets Card */}
          <div className={cn(
            "p-5 rounded-2xl shadow-sm border transition-colors duration-300",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bookmark size={18} className="text-blue-500" fill="none" strokeWidth={2.5} />
                <h2 className="text-[16px] font-bold tracking-tight">Presets</h2>
              </div>
              <button 
                onClick={savePreset}
                className="text-[13px] font-bold text-blue-500 hover:opacity-70 transition-opacity flex items-center gap-1"
              >
                <Plus size={14} strokeWidth={3} />
                Save Current
              </button>
            </div>
            <p className={cn(
              "text-[13px] font-medium leading-tight",
              isDarkMode ? "text-slate-400" : "text-slate-500"
            )}>
              কোনো প্রিসেট নেই। Amount ও Steps দিয়ে "Save Current" চাপুন।
            </p>
          </div>

          {/* Calculator Card */}
          <div className={cn(
            "p-6 md:p-8 rounded-[2rem] shadow-sm border transition-colors duration-300 space-y-6",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                  <label className="text-[14px] font-bold ml-2 block italic">মোট পরিমাণ (Amount)</label>
                  <input 
                    type="number" 
                    placeholder="যেমন: 1000"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className={cn(
                      "w-full border rounded-xl px-5 py-4 outline-none focus:border-blue-500 transition-all font-medium text-lg",
                      isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                    )}
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[14px] font-bold ml-2 block italic">স্টেপের সংখ্যা (Steps)</label>
                  <input 
                    type="number" 
                    placeholder="৫ - ৫০"
                    value={stepCount}
                    onChange={e => setStepCount(e.target.value === '' ? '' : Math.min(50, Math.max(1, Number(e.target.value))))}
                    className={cn(
                      "w-full border rounded-xl px-5 py-4 outline-none focus:border-blue-500 transition-all font-medium text-lg",
                      isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                    )}
                  />
               </div>
               <div className="space-y-3 md:col-span-2">
                  <label className="text-[14px] font-bold ml-2 block italic">আপনার নোট (ঐচ্ছিক)</label>
                  <textarea 
                    placeholder="এখানে কিছু লিখুন..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className={cn(
                      "w-full border rounded-xl px-5 py-4 outline-none focus:border-blue-500 transition-all font-medium text-md h-24 resize-none",
                      isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                    )}
                  />
               </div>
             </div>

             <div className="flex gap-4 pt-2">
                <button 
                  onClick={handleCalculate}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4.5 rounded-[1rem] font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
                >
                  <Calculator size={18} fill="currentColor" />
                  Calculate Steps
                </button>
                <button 
                  onClick={reset}
                  className={cn(
                    "px-8 py-4.5 rounded-[1rem] border font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm",
                    isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-600"
                  )}
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
             </div>

             {/* Warning Message Box - Repositioned inside the card below buttons */}
             <AnimatePresence>
               {showError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#f2e7e7] border border-[#e8d5d5] p-5 rounded-2xl flex items-center gap-4 overflow-hidden"
                  >
                     <div className="size-7 rounded-md flex items-center justify-center shrink-0">
                        <AlertTriangle size={22} className="text-[#facc15]" fill="#facc15" stroke="white" strokeWidth={2.5} />
                     </div>
                     <p className="text-[14px] font-bold text-slate-800 leading-tight">
                       দয়া করে সঠিক পরিমাণ (Amount) লিখুন।
                     </p>
                  </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Results Outcome */}
          {isCalculated && calculatedSteps.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Amount', value: totalAmount, color: isDarkMode ? 'text-white' : 'text-slate-800' },
                  { label: 'Steps', value: stepCount, color: isDarkMode ? 'text-white' : 'text-slate-800' },
                  { label: 'Total Used', value: totalAmount, color: isDarkMode ? 'text-white' : 'text-slate-800' },
                  { label: `Win (${winMultiplier}x)`, value: calculatedSteps[calculatedSteps.length - 1].win.toFixed(3), color: isDarkMode ? 'text-white' : 'text-slate-800' },
                ].map((card, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border shadow-sm flex flex-col justify-center transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  )}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{card.label}</span>
                    <span className={cn("text-[18px] font-black", card.color)}>{card.value}</span>
                  </div>
                ))}
              </div>

              {/* Chart Card */}
              <div className={cn(
                "p-6 rounded-[2rem] shadow-sm border transition-colors",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
              )}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-slate-400" size={18} />
                    <h3 className={cn("text-[14px] font-bold", isDarkMode ? "text-white" : "text-slate-800")}>Step Distribution</h3>
                  </div>
                  <div className={cn("flex p-1 rounded-lg gap-1", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                    {['Bar', 'Line', 'Area'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setChartType(type as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                          chartType === type 
                            ? (isDarkMode ? "bg-slate-700 text-blue-400 shadow-sm" : "bg-white text-blue-600 shadow-sm") 
                            : "text-slate-400"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'Bar' ? (
                      <BarChart data={calculatedSteps} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                          cursor={{ fill: isDarkMode ? '#334155' : '#f8fafc', radius: 8 }}
                        />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={calculatedSteps.length > 10 ? 15 : 40}>
                          {calculatedSteps.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === calculatedSteps.length - 1 ? '#3b82f6' : '#94a3b8'} fillOpacity={index === calculatedSteps.length - 1 ? 1 : 0.4} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : chartType === 'Line' ? (
                      <LineChart data={calculatedSteps} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="win" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: isDarkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={calculatedSteps} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Table */}
              <div className={cn(
                "rounded-[2rem] shadow-sm border transition-colors overflow-hidden",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
              )}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className={cn(
                        "text-[11px] font-black text-slate-400 uppercase tracking-widest border-b transition-colors",
                        isDarkMode ? "bg-slate-800/50 border-slate-800" : "bg-slate-50/50 border-slate-100"
                      )}>
                        <th className="px-6 py-5">Step</th>
                        <th className="px-6 py-5">Amount</th>
                        <th className="px-6 py-5 text-center">Win <span className="text-[9px] opacity-70">({winMultiplier}x)</span></th>
                        <th className="px-6 py-5">Cumulative</th>
                        <th className="px-6 py-5 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-[13px]">
                      {calculatedSteps.map(row => (
                        <tr key={row.step} className={cn(
                          "border-b transition-colors",
                          isDarkMode ? "border-slate-800 hover:bg-slate-800/50" : "border-slate-50 hover:bg-slate-50"
                        )}>
                          <td className="px-6 py-4 text-slate-500">Step {row.step}</td>
                          <td className={cn("px-6 py-4", isDarkMode ? "text-slate-200" : "text-slate-800")}>{row.amount.toFixed(6)}</td>
                          <td className="px-6 py-4 text-center text-emerald-500">{row.win.toFixed(6)}</td>
                          <td className="px-6 py-4 text-slate-400">{row.cumulative.toFixed(6)}</td>
                          <td className={cn("px-6 py-4 text-right tabular-nums", row.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            +{row.profit.toFixed(6)}
                          </td>
                        </tr>
                      ))}
                      <tr className={cn(
                        "font-black transition-colors",
                        isDarkMode ? "bg-slate-800/20" : "bg-slate-50/30"
                      )}>
                        <td className="px-6 py-5 uppercase text-[12px] text-slate-500">Total</td>
                        <td className={cn("px-6 py-5", isDarkMode ? "text-slate-200" : "text-slate-800")}>{totalAmount}</td>
                        <td colSpan={3}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pb-8">
                <button onClick={handleCopy} className={cn(
                  "flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 rounded-xl border font-bold text-[13px] shadow-sm active:scale-95 transition-all text-slate-600",
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100"
                )}>
                  <Copy size={16} /> Copy
                </button>
                <button onClick={handleShare} className={cn(
                  "flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 rounded-xl border font-bold text-[13px] shadow-sm active:scale-95 transition-all text-blue-600",
                  isDarkMode ? "bg-blue-900/30 border-blue-900/50 text-blue-400" : "bg-blue-50 border-blue-100"
                )}>
                  <Share2 size={16} /> Share
                </button>
                <button onClick={handleDownloadPNG} className={cn(
                  "flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 rounded-xl border font-bold text-[13px] shadow-sm active:scale-95 transition-all text-emerald-600",
                  isDarkMode ? "bg-emerald-900/30 border-emerald-900/50 text-emerald-400" : "bg-emerald-50 border-emerald-100"
                )}>
                  <FileImage size={16} /> PNG
                </button>
                <button onClick={handleDownloadPDF} className={cn(
                  "flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 rounded-xl border font-bold text-[13px] shadow-sm active:scale-95 transition-all text-purple-600",
                  isDarkMode ? "bg-purple-900/30 border-purple-900/50 text-purple-400" : "bg-purple-50 border-purple-100"
                )}>
                  <FileText size={16} /> PDF
                </button>
              </div>
            </motion.div>
          )}

          <footer className="text-center pt-8 pb-16 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-[11px] font-bold uppercase tracking-widest mb-1",
                isDarkMode ? "text-slate-600" : "text-slate-400"
              )}>Developed By</span>
              <a 
                href="https://t.me/TRADER_TAMIM_3" 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "font-black text-lg hover:underline transition-all",
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                )}
              >
                TRADER TAMIM STEP
              </a>
            </div>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isDarkMode ? "text-slate-700" : "text-slate-300"
            )}>
              © 2026 | TRADER TAMIM STEP — Advanced Step Calculator
            </p>
          </footer>
        </main>
      </div>

      {/* Export Node - Positioned off-screen to allow proper rendering for html2canvas */}
      <div className="fixed -top-[5000px] left-0 pointer-events-none">
        <div ref={exportRef} className="w-[800px] bg-slate-950 p-12 text-white font-sans">
          <div className="mb-12 border-b border-slate-800 pb-8 flex justify-between items-end">
             <div>
                <h2 className="text-3xl font-black tracking-tight mb-2">TRADER TAMIM STEP — Step Calculator</h2>
                <p className="text-xl text-slate-500 font-bold">Win Multiplier: {winMultiplier}x</p>
             </div>
             <p className="text-slate-700 text-sm font-black">© 2026 TRADER TAMIM STEP</p>
          </div>
          
          {notes && (
            <div className="mb-8 p-6 bg-slate-900/30 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-600 font-black uppercase mb-2 block tracking-widest">Notes</span>
              <p className="text-slate-200 text-lg font-medium italic">"{notes}"</p>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-6 mb-12">
             <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                <span className="text-xs text-slate-500 font-black uppercase mb-2 block">Amount</span>
                <span className="text-3xl font-black">{totalAmount}</span>
             </div>
             <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                <span className="text-xs text-slate-500 font-black uppercase mb-2 block">Steps</span>
                <span className="text-3xl font-black">{stepCount}</span>
             </div>
             <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                <span className="text-xs text-slate-500 font-black uppercase mb-2 block">Total</span>
                <span className="text-3xl font-black">{totalAmount}</span>
             </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-500 uppercase font-black tracking-widest">
                <th className="py-5 px-2">Step</th>
                <th className="py-5 px-2">Amount</th>
                <th className="py-5 px-2">Win</th>
                <th className="py-5 px-2 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="text-[15px] font-bold">
              {calculatedSteps.map(s => (
                <tr key={s.step} className="border-b border-slate-900/50">
                  <td className="py-5 px-2 text-slate-500 uppercase text-[12px]">Step {s.step}</td>
                  <td className="py-5 px-2 text-white tabular-nums">{s.amount.toFixed(6)}</td>
                  <td className="py-5 px-2 text-emerald-500 tabular-nums">{s.win.toFixed(6)}</td>
                  <td className="py-5 px-2 text-right text-emerald-400 tabular-nums">+{s.profit.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-20 flex flex-col items-center gap-2">
             <p className="text-[11px] text-slate-700 font-black tracking-[0.3em] uppercase">© 2026 | TRADER TAMIM STEP</p>
          </div>
        </div>
      </div>

    </div>
  );
}

const calculatedSlidesIdx = -1; // Placeholder for cell highlighting logic if needed

