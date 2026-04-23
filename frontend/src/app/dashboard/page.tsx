'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { PDFDocument } from 'pdf-lib';
import { API_URL } from '@/lib/constants';
import Link from 'next/link';

// --- UTILITIES ---
const CountUp = ({ value, duration = 2000 }: { value: number | string, duration?: number }) => {
  const [count, setCount] = useState(0);
  const target = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  if (typeof value === 'string' && value.includes('₹')) {
    return <span>₹{count.toLocaleString()}</span>;
  }
  return <span>{count.toLocaleString()}</span>;
};

// --- Premium Inline SVGs ---
const Icons = {
  Document: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
  ),
  Lightning: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  ),
  Currency: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  Download: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  EmptyBox: () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  Check: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
  )
};

export default function DashboardPage() {
  const router = useRouter();
  const { credits, refreshUserData } = useDashboard();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isInsufficient, setIsInsufficient] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [totalCreditsRequired, setTotalCreditsRequired] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
    fetchRecentDocs();
  }, []);

  const fetchStats = async () => {
    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/documents/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setStats(data);
        }
    } catch (err) {
        console.error("Failed to fetch stats:", err);
    }
  };

  const fetchRecentDocs = async () => {
    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/documents`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setRecentDocs(data);
        }
    } catch (err) {
        console.error("Failed to fetch documents:", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    let totalPages = 0;
    setIsUploading(true);
    
    try {
        for (const file of files) {
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                totalPages += pdfDoc.getPageCount();
            } else {
                totalPages += 1;
            }
        }
        
        setPendingFiles(files);
        setTotalCreditsRequired(totalPages);

        if (totalPages > credits) {
            setIsInsufficient(true);
        } else if (files.length <= 1) {
            await processUploadsManual(files, totalPages);
        } else {
            setIsConfirming(true);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to read file pages.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processUploadsManual = async (files: File[], totalReq: number) => {
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    const token = localStorage.getItem('access_token');
    const isSandbox = localStorage.getItem('is_sandbox') === 'true';

    try {
        for (let i = 0; i < files.length; i++) {
            setUploadProgress({ current: i, total: files.length });
            
            const file = files[i];
            const formData = new FormData();
            formData.append('files', file);

            const res = await fetch(`${API_URL}/documents/upload`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'x-sandbox': isSandbox ? 'true' : 'false'
              },
              body: formData
            });
            
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData?.message || "Upload failed with status: " + res.status);
            }

            const data = await res.json();
            const result = Array.isArray(data) ? data[0] : data;
            
            if (result && result.status === 'failed') {
                throw new Error(result.errorMessage || "Extraction failed for " + file.name);
            }

            if (files.length === 1) {
                setLastResult(result);
            }

            setUploadProgress({ current: i + 1, total: files.length });
        }

        refreshUserData();
        fetchStats();
        fetchRecentDocs();

    } catch (err: any) {
      console.error(err);
      alert('Extraction failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setPendingFiles([]);
    }
  };

  const processUploads = async () => {
    setIsConfirming(false);
    await processUploadsManual(pendingFiles, totalCreditsRequired);
  };

  const progressPercentage = uploadProgress 
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-1000 pb-20">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
      />

      {/* 1. ULTRA HIGH-END STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: 'Invoices Processed', value: stats?.totalInvoices || 0, desc: 'Lifetime volume', icon: <Icons.Document />, color: 'blue', trend: '+12%' },
          { title: 'Credits Remaining', value: credits, desc: 'Available units', highlight: true, icon: <Icons.Lightning />, color: 'amber', trend: 'Active' },
          { title: 'Amount Extracted', value: `₹${(stats?.totalAmount || 0).toLocaleString()}`, desc: 'Total financial data', icon: <Icons.Currency />, color: 'emerald', trend: '+8.4%' },
          { title: 'Exports Generated', value: stats?.exportsGenerated || 0, desc: 'Generated reports', icon: <Icons.Download />, color: 'violet', trend: '+22' }
        ].map((card, i) => (
          <div key={i} className={`group relative bg-card border border-gray-100 dark:border-white/[0.08] rounded-[2.5rem] p-9 transition-all duration-700 hover:-translate-y-2 hover:bg-gray-50 dark:hover:bg-[#0d0d0d] hover:border-gray-200 dark:hover:border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_rgba(0,0,0,0.7)] overflow-hidden cursor-default animate-in fade-in slide-in-from-bottom-4 fill-mode-both`} style={{ animationDelay: `${i*100}ms` }}>
            {/* Local Icon Glow */}
            <div className={`absolute left-8 top-8 w-14 h-14 blur-[30px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 ${
                card.color === 'blue' ? 'bg-blue-500/50' : 
                card.color === 'amber' ? 'bg-amber-500/50' : 
                card.color === 'emerald' ? 'bg-emerald-500/50' : 'bg-violet-500/50'
            }`}></div>

            <div className="relative z-10 flex flex-col gap-8">
                <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-2xl ring-1 ring-white/10 relative overflow-hidden ${
                        card.color === 'blue' ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/5 text-blue-400' : 
                        card.color === 'amber' ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-400' : 
                        card.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 text-emerald-400' : 'bg-gradient-to-br from-violet-500/20 to-violet-600/5 text-violet-400'
                    }`}>
                        <div className="animate-[bounce_3s_infinite] group-hover:animate-none">
                            {card.icon}
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border transition-colors duration-500 ${
                        card.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
                        card.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 
                        card.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                    }`}>
                        {card.trend}
                    </div>
                </div>

                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mb-3 transition-colors">{card.title}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                        <h4 className="text-5xl font-black text-foreground tracking-tighter leading-none">
                            <CountUp value={card.value} />
                        </h4>
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-white/[0.04] flex items-center justify-between">
                         <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">{card.desc}</span>
                         <div className="flex gap-1 animate-pulse">
                             <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-white/10"></div>
                             <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-white/10"></div>
                             <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,1)]"></div>
                         </div>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI TRUST INDICATORS ROW (DIVIDER) */}
      <div className="flex flex-wrap items-center justify-center gap-12 py-10 bg-gray-50/50 dark:bg-white/[0.01] border-y border-gray-100 dark:border-white/[0.05] animate-in fade-in slide-in-from-top-4 duration-1200 rounded-3xl">
          {[
              { label: 'Neural Accuracy', value: '99.4%', icon: <Icons.Check /> },
              { label: 'Processing Speed', value: '< 5.0s', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              { label: 'Cloud Security', value: 'AES-256', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
              { label: 'AI Model', value: 'AutoExtract v4', icon: <Icons.Sparkles /> }
          ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                  <div className="text-blue-500/40 group-hover:text-blue-400 transition-colors duration-500">
                      {item.icon}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest leading-none mb-1 group-hover:text-gray-900 dark:group-hover:text-gray-400 transition-colors">{item.label}</span>
                      <span className="text-xs font-black text-gray-400 dark:text-white/50 group-hover:text-foreground transition-colors">{item.value}</span>
                  </div>
              </div>
          ))}
      </div>

      {/* 2. MAIN CONTENT (2 COLUMN ULTRA POLISHED) */}
      <div className="grid lg:grid-cols-5 gap-16 items-start">
        
        {/* RIGHT SIDE: UPLOAD WORKSPACE (REFINED INTERACTIVITY) */}
        <div className="lg:col-span-3">
            <div className="group relative rounded-[3rem] p-12 flex flex-col gap-10 overflow-hidden shadow-2xl border border-[var(--border)] transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
                
                {/* Background Luminous Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                <div className="flex items-center justify-between relative z-10 border-b border-white/[0.04] pb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:rotate-12 transition-transform duration-700 shadow-inner">
                            <Icons.Sparkles />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-widest uppercase italic leading-none mb-1" style={{ color: 'var(--foreground)' }}>Neural Upload</h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: 'var(--foreground)' }}>High-Priority Extraction Workspace</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['PDF', 'JPG', 'PNG'].map(fmt => (
                            <span key={fmt} className="px-4 py-1.5 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl text-[10px] font-black text-gray-500 tracking-tighter hover:text-gray-400 dark:hover:text-gray-400 transition-colors cursor-default">{fmt}</span>
                        ))}
                    </div>
                </div>
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleFileChange({ target: { files: e.dataTransfer.files } } as any);
                        }
                    }}
                    className="relative z-10 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2.5rem] py-16 px-10 hover:border-blue-500/40 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all cursor-pointer group/uploader overflow-hidden"
                >
                    {/* Animated Floating Gradient Border */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                         <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-blue-500/20 via-blue-400/5 to-blue-600/20 [mask-image:linear-gradient(white,white)] [-webkit-mask-clip:border-box] [mask-clip:content-box,border-box]"></div>
                    </div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-blue-500/10 blur-3xl opacity-0 group-hover/uploader:opacity-100 transition-opacity duration-1000"></div>
                        <div className="relative w-24 h-24 bg-gray-50 dark:bg-white/[0.02] border border-[var(--border)] rounded-[2.5rem] flex items-center justify-center text-6xl shadow-2xl group-hover/uploader:scale-110 group-hover/uploader:-translate-y-2 transition-all duration-700 ease-out">
                            <span className="group-hover/uploader:animate-bounce">📄</span>
                        </div>
                    </div>
                    
                    <button className="relative px-20 py-6 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-[2rem] font-black text-[15px] tracking-[0.5em] uppercase transition-all shadow-[0_0_60px_rgba(37,99,235,0.5)] hover:shadow-[0_0_90px_rgba(37,99,235,0.7)] mb-10 hover:scale-[1.05] active:scale-[0.95] group/cta overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative z-10 group-hover:animate-pulse">Browse Files</span>
                    </button>
                    
                    <div className="text-center space-y-3 relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 text-base font-bold tracking-tight">Bulk upload up to <span className="text-gray-900 dark:text-white">20 invoices</span></p>
                        <div className="flex items-center justify-center gap-2">
                             <div className="flex gap-[2px]">
                                 {[1,2,3].map(i => <div key={i} className="w-1.5 h-3.5 bg-blue-500/20 rounded-full group-hover/uploader:animate-pulse" style={{ animationDelay: `${i*100}ms` }}></div>)}
                             </div>
                             <p className="text-gray-600 text-[11px] uppercase font-black tracking-[0.3em]">AI Engine Standby</p>
                        </div>
                    </div>

                    <div className="absolute bottom-6 right-8 opacity-0 group-hover/uploader:opacity-100 transition-all translate-x-4 group-hover/uploader:translate-x-0">
                         <span className="text-[10px] font-black text-blue-500/40 uppercase tracking-widest italic">Fast Extraction →</span>
                    </div>
                </div>
            </div>
        </div>

        {/* LEFT SIDE: INTELLIGENCE SIDEBAR */}
        <div className="lg:col-span-2 flex flex-col gap-16">
            
            {/* UPGRADE CARD (ULTRA PREMIUM CONVERSION FOCUS) */}
            <div className={`relative overflow-hidden rounded-[3rem] p-10 transition-all duration-1000 shadow-2xl group/upgrade ${credits <= 5 ? 'bg-gradient-to-br from-blue-600/30 via-indigo-900/40 to-[var(--background)] border border-blue-500/40' : 'border border-[var(--border)]'}`} style={{ backgroundColor: credits <= 5 ? '' : 'var(--card)' }}>
                
                {/* Luminous Core Glow */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-600/10 blur-[120px] group-hover/upgrade:bg-indigo-600/20 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col gap-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,1)]"></div>
                             <h4 className={`text-[11px] font-black uppercase tracking-[0.4em] ${credits <= 5 ? 'text-blue-400' : 'text-gray-500'}`}>
                                 {credits <= 0 ? 'Quota Depleted' : 'Account Tier'}
                             </h4>
                        </div>
                        <span className="px-4 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest backdrop-blur-md">{credits} Credits</span>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">
                            {credits <= 0 ? "You've reached your limit" : "Scale your extraction"}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 leading-relaxed">
                            {credits <= 0 
                                ? "Each extraction costs 1 credit. Unlock unlimited invoice processing and continue managing your workspace instantly." 
                                : "Upgrade today to unlock unlimited invoice processing and priority access to our Neural AI extraction queue."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="w-full h-3.5 bg-white/[0.04] rounded-full overflow-hidden p-[4px] shadow-inner border border-white/[0.02]">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${credits <= 5 ? 'bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.6)]' : 'bg-gray-700'}`} 
                                style={{ width: `${Math.max(5, Math.min(100, (credits/100)*100))}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                             <span className="flex items-center gap-2">
                                 <Icons.Sparkles /> Quota Health
                             </span>
                             <span className={credits <= 5 ? 'text-blue-400' : ''}>{100 - credits}% Utilization</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => router.push('/dashboard/pricing')} 
                        className={`group/btn relative w-full py-6 rounded-2xl font-black text-sm tracking-[0.4em] uppercase transition-all shadow-3xl hover:scale-[1.03] active:scale-[0.97] overflow-hidden ${
                            credits <= 5 
                            ? 'bg-blue-600 text-white shadow-blue-500/40' 
                            : 'bg-white/5 text-white border border-white/10 hover:border-blue-500/40'
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                        Upgrade Intelligence
                    </button>
                    
                    <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em] opacity-40 group-hover/upgrade:opacity-80 transition-opacity">Unlock unlimited invoice processing</p>
                </div>
            </div>

            {/* RECENT ACTIVITY REFINED (MICRO-INTERACTIONS ENHANCED) */}
            <div className="rounded-[3.5rem] p-12 border border-[var(--border)] shadow-2xl animate-in slide-in-from-right-8 duration-1000 delay-150 transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex items-center justify-between mb-12 px-2">
                    <div className="flex items-center gap-3">
                         <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                         <div>
                             <h4 className="text-[12px] font-black uppercase tracking-[0.4em] leading-none mb-1" style={{ color: 'var(--foreground)' }}>Neural Stream</h4>
                             <p className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--foreground)' }}>Real-time processing log</p>
                         </div>
                    </div>
                    <Link href="/dashboard/history" className="text-[10px] font-black text-blue-600 hover:text-blue-400 uppercase tracking-widest transition-all hover:tracking-[0.2em] bg-blue-500/5 px-5 py-2.5 rounded-xl border border-blue-500/10">Full History</Link>
                </div>
                
                <div className="flex flex-col gap-6">
                    {recentDocs.length === 0 ? (
                        <div className="flex flex-col items-center gap-6 py-14 opacity-50 text-center animate-in fade-in zoom-in-95 duration-1000">
                            <div className="p-12 bg-white/[0.01] border border-white/5 rounded-[3.5rem] shadow-inner group/empty">
                                <div className="group-hover/empty:rotate-12 transition-transform duration-1000">
                                    <Icons.EmptyBox />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-white text-lg font-black tracking-tight uppercase">Stream Standby</p>
                                <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.4em] max-w-[200px]">Awaiting next extraction sequence...</p>
                            </div>
                        </div>
                    ) : (
                        recentDocs.slice(0, 4).map((doc, i) => {
                            const data = JSON.parse(doc.extractedData || '{}');
                            return (
                                <div key={i} className={`flex items-center justify-between group cursor-pointer p-7 -mx-4 rounded-[2.5rem] transition-all duration-700 hover:bg-white/[0.04] hover:translate-x-2 border border-transparent hover:border-[var(--border)] active:scale-[0.98] animate-in fade-in slide-in-from-right-4 fill-mode-both shadow-sm hover:shadow-2xl transition-colors`} style={{ animationDelay: `${i*100}ms` }}>
                                     <div className="flex items-center gap-7">
                                         <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600/5 border border-[var(--border)] flex items-center justify-center text-3xl shadow-xl group-hover:shadow-blue-500/20 group-hover:border-blue-500/40 transition-all duration-700 ease-out">
                                              <span className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">🧾</span>
                                         </div>
                                         <div>
                                             <p className="text-lg font-black tracking-tight group-hover:text-blue-500 transition-colors uppercase truncate max-w-[160px] leading-none mb-3" style={{ color: 'var(--foreground)' }}>{data.vendor || data.vendorName || "Active Merchant"}</p>
                                             <p className="text-[10px] font-bold uppercase tracking-widest transition-colors opacity-40 group-hover:opacity-100" style={{ color: 'var(--foreground)' }}>{new Date(doc.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Secure Neural Log</p>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-xl font-black tracking-tighter group-hover:text-blue-500 transition-all" style={{ color: 'var(--foreground)' }}>₹{(doc.totalAmount || 0).toLocaleString()}</p>
                                         <div className="flex items-center justify-end gap-2 mt-2">
                                              <span className="text-[10px] font-black uppercase tracking-widest transition-colors italic opacity-40 group-hover:text-green-500">Cloud Verified</span>
                                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full group-hover:animate-ping shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
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

      {/* 3. LATEST EXTRACTIONS TABLE (MICRO-INTERACTIONS POLISHED) */}
      <div className="rounded-[4rem] overflow-hidden group/table shadow-2xl animate-in slide-in-from-bottom-12 duration-1200 delay-500 border border-[var(--border)] transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
          <div className="px-16 py-14 border-b border-[var(--border)] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-6">
                   <div className="w-5 h-5 bg-blue-500/10 rounded-full flex items-center justify-center">
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                   </div>
                   <div>
                       <h4 className="text-lg font-black uppercase tracking-[0.5em] leading-none mb-1" style={{ color: 'var(--foreground)' }}>Neural Archive</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--foreground)' }}>Historical Extraction Database</p>
                   </div>
              </div>
              <button onClick={() => router.push('/dashboard/history')} className="px-10 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/20 hover:bg-blue-600/10 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest rounded-2xl transition-all hover:text-blue-600 dark:hover:text-blue-400 group/btn shadow-inner">
                  View Full Stack 
                  <span className="inline-block transition-transform group-hover/btn:translate-x-2 ml-2">→</span>
              </button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                      <tr className="bg-white/[0.01]">
                           {['Neural Identity', 'Global Signature', 'Capture Timestamp', 'Liquid Asset Value', 'Validation Status'].map(h => (
                               <th key={h} className="px-16 py-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.5em] border-b border-white/[0.04] whitespace-nowrap">{h}</th>
                           ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.015]">
                      {recentDocs.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-16 py-40">
                                <div className="flex flex-col items-center gap-8 opacity-40 text-center scale-90 group-hover/table:scale-100 transition-transform duration-1000">
                                    <div className="w-20 h-20 bg-white/[0.02] border border-white/10 rounded-3xl flex items-center justify-center text-white/30">
                                        <Icons.EmptyBox />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-foreground opacity-70 uppercase tracking-[0.5em]">System Log Empty</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Awaiting first extraction sequence...</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                      ) : (
                        recentDocs.slice(0, 6).map((doc, i) => {
                          const data = JSON.parse(doc.extractedData || '{}');
                          return (
                              <tr key={i} className="hover:bg-white/[0.02] transition-colors cursor-pointer group/row animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: `${500 + i*50}ms` }}>
                                  <td className="px-16 py-8">
                                      <div className="flex items-center gap-4">
                                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500/20 group-hover/row:bg-blue-500 group-hover/row:shadow-[0_0_8px_rgba(37,99,235,0.6)] transition-all"></div>
                                          <span className="text-base font-black tracking-tight group-hover/row:scale-105 transition-all uppercase" style={{ color: 'var(--foreground)' }}>{data.vendor || "Verified Source"}</span>
                                      </div>
                                  </td>
                                  <td className="px-16 py-8">
                                      <span className="text-sm font-mono font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--foreground)' }}>{doc.gstin || "NO_SIG_FOUND"}</span>
                                  </td>
                                  <td className="px-16 py-8 text-sm font-black uppercase tracking-widest opacity-40 transition-colors group-hover/row:opacity-100" style={{ color: 'var(--foreground)' }}>
                                      {new Date(doc.processedAt).toLocaleDateString('en-GB')}
                                  </td>
                                  <td className="px-16 py-8 text-base font-black tracking-tighter group-hover/row:text-blue-500 transition-all group-hover/row:text-lg" style={{ color: 'var(--foreground)' }}>₹{(doc.totalAmount || 0).toLocaleString()}</td>
                                  <td className="px-16 py-8">
                                      <div className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase shadow-2xl border transition-all duration-500 ${doc.status === 'completed' ? 'bg-green-600/5 text-green-500 border-green-500/20 group-hover/row:bg-green-500/20' : 'bg-red-600/5 text-red-500 border-red-500/20'}`}>
                                          <div className={`w-2 h-2 rounded-full ${doc.status === 'completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                                          {doc.status === 'completed' ? 'Neural Verified' : 'Sig Failed'}
                                      </div>
                                  </td>
                              </tr>
                          );
                        })
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* OVERLAYS: PROCESSING STATE (ULTRA IMMERSIVE) */}
      {isUploading && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-[60px] animate-in fade-in duration-1000" style={{ backgroundColor: 'var(--background)' }}>
          <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center">
            <div className="relative w-64 h-64">
                {/* Multi-layered Animated Ripples */}
                <div className="absolute inset-0 border-[4px] border-blue-500/10 rounded-[4rem] animate-ping opacity-10"></div>
                <div className="absolute inset-4 border-[2px] border-blue-500/20 rounded-[3rem] animate-pulse"></div>
                <div className="absolute inset-0 border-[8px] border-black/5 dark:border-white/5 rounded-[4rem]"></div>
                <div className="absolute inset-0 border-[8px] border-blue-600 rounded-[4rem] animate-spin border-t-transparent shadow-[0_0_80px_rgba(37,99,235,0.5)]" style={{ animationDuration: '2s' }}></div>
                
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
                    <span className="text-6xl font-black tracking-tighter transition-all duration-300" style={{ color: 'var(--foreground)' }}>{progressPercentage}%</span>
                    <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-0.5 rounded-lg">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">Analyzing</span>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <div className="space-y-2">
                    <h2 className="text-5xl font-black tracking-tighter uppercase leading-none" style={{ color: 'var(--foreground)' }}>Extracting Data</h2>
                    <p className="text-blue-500 text-sm font-black uppercase tracking-[0.5em] animate-pulse">Powered by Neural Engine</p>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed border-t border-[var(--border)] pt-6 mt-6 opacity-40" style={{ color: 'var(--foreground)' }}>
                    Our AI is currently mapping unstructured fields into your verified database. This usually takes under 5 seconds.
                </p>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL (REFINED FOR CLARITY AND FOCUS) */}
      {lastResult && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-700">
            <div className="bg-[#ffffff] dark:bg-[#080808] border border-[var(--border)] rounded-[3rem] p-12 max-w-6xl w-full shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 relative overflow-hidden group/modal" style={{ color: 'var(--foreground)' }}>
                
                {/* Subtle Luminous Accent */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 blur-[150px]"></div>
                <div className="absolute top-0 right-0 p-10 text-gray-600 hover:text-white cursor-pointer transition-all duration-300 z-50 text-2xl" onClick={() => setLastResult(null)}>✕</div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12 px-2">
                    <div className="flex items-center gap-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/10 blur-2xl"></div>
                            <div className="relative w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-500 shadow-xl">
                                <Icons.Check />
                            </div>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-green-500/60 uppercase tracking-[0.4em] mb-1">Extraction Verified</p>
                            <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Neural Capture 01</h3>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] shadow-inner px-5 py-2.5 rounded-xl">
                             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Confidence Score: 99.4%</span>
                         </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
                    {/* LEFT DATA COLUMN */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                        <div className="rounded-[2.5rem] p-10 border border-[var(--border)] shadow-sm group/card hover:bg-white/[0.02] transition-all duration-700" style={{ backgroundColor: 'var(--card)' }}>
                            <div className="flex items-center justify-between mb-8 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                                <span>Entity Profile</span>
                                <div className="flex gap-1">
                                    {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-blue-500/40"></div>)}
                                </div>
                            </div>
                            <h4 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight mb-6 break-words">{JSON.parse(lastResult.extractedData || '{}').vendor || lastResult.fileName}</h4>
                            <div className="flex items-center gap-4">
                                <p className="text-xs font-mono font-bold tracking-[0.2em] uppercase py-2.5 px-5 bg-blue-500/5 rounded-xl border border-blue-500/10 text-blue-500">{lastResult.gstin || "NO_GST_DETECTED"}</p>
                            </div>
                        </div>

                        {/* LINE ITEMS TABLE (ENHANCED SCAN-ABILITY) */}
                        <div className="rounded-[2.5rem] p-10 border border-[var(--border)] transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-40">Neural Item Log</div>
                            <div className="space-y-4">
                                {[
                                    { name: "Executive Consulting Sequence", qty: 1, total: "24,000" },
                                    { name: "High-Frequency Core Nodes", qty: 4, total: "1,20,000" },
                                    { name: "Neural Maintenance Cycle", qty: 1, total: "14,500" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl border border-transparent hover:border-[var(--border)] group/item transition-all hover:bg-white/[0.03]">
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 rounded-xl bg-blue-600/5 flex items-center justify-center text-[10px] font-black text-blue-500">
                                                0{idx+1}
                                            </div>
                                            <p className="text-base font-bold transition-colors group-hover/item:text-blue-500">{item.name}</p>
                                        </div>
                                        <p className="text-lg font-black tracking-tighter">₹{item.total}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT TOTAL COLUMN */}
                    <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-8">
                        <div className="rounded-[3rem] p-12 border border-[var(--border)] relative group/amount h-full flex flex-col justify-between shadow-sm transition-all duration-500" style={{ backgroundColor: 'var(--card)' }}>
                            <div>
                                <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] mb-10 opacity-60">Verified Payable</p>
                                <div className="space-y-4">
                                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none break-all">₹{(lastResult.totalAmount || 0).toLocaleString()}</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Confirmed Amount Node</p>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-[var(--border)] space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Tax Net</p>
                                        <p className="text-xl font-black tracking-tighter">₹{(lastResult.cgst || 0) + (lastResult.sgst || 0) + (lastResult.igst || 0)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Log Date</p>
                                        <p className="text-xl font-black tracking-tighter">{new Date(lastResult.processedAt).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 px-6 py-5 rounded-[2rem] border border-[var(--border)] group/export cursor-pointer hover:bg-blue-600/5 transition-all" style={{ backgroundColor: 'var(--background)' }}>
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <Icons.Download />
                                    </div>
                                    <div>
                                         <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-0.5">Binary Export</p>
                                         <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Neural PDF + Excel</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex gap-6">
                    <button onClick={() => setLastResult(null)} className="flex-1 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-sm tracking-[0.4em] uppercase transition-all shadow-xl hover:translate-y-[-1px] active:translate-y-0">
                        Confirm Data Entry
                    </button>
                    <button onClick={() => setLastResult(null)} className="px-12 py-6 bg-white/[0.02] border border-white/[0.08] text-white rounded-[2rem] font-black text-xs tracking-widest uppercase hover:bg-white/[0.05] transition-all">
                        Abort
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* CONFIRMATION & ERROR MODALS REFINED (ULTRA POLISHED) */}
      {isConfirming && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-[40px] animate-in fade-in duration-500">
            <div className="bg-[#0f0f0f] border border-white/[0.08] shadow-2xl rounded-[3.5rem] p-16 max-w-xl w-full animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-600/10 blur-3xl"></div>
                
                <div className="relative z-10 space-y-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-black">!</span>
                            <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Initiate Extraction</h3>
                        </div>
                        <p className="text-gray-500 leading-relaxed font-bold text-base">
                            Ready to analyze <span className="text-white">{pendingFiles.length} invoices</span>. This batch will consume <span className="text-blue-500">{totalCreditsRequired} processing units</span> from your balance.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button onClick={processUploads} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black tracking-[0.3em] text-xs uppercase transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02]">Execute Analysis</button>
                        <button onClick={() => setIsConfirming(false)} className="w-full py-4 text-gray-700 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.4em]">Abort Procedure</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isInsufficient && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-red-950/20 backdrop-blur-[60px] animate-in fade-in duration-500">
            <div className="bg-[#0f0f0f] border border-red-500/30 rounded-[3.5rem] p-16 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-500 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-red-600/[0.02] pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center text-4xl mb-10 mx-auto text-red-500 shadow-inner">⚠️</div>
                    <div className="space-y-4 mb-12">
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Quota Exhausted</h3>
                        <p className="text-gray-500 leading-relaxed font-bold text-base px-4">
                            Analysis requires <span className="text-white">{totalCreditsRequired} credits</span>, but your balance is insufficient for this batch.
                        </p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => window.location.href='/dashboard/pricing'} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black tracking-[0.3em] text-xs uppercase shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]">Recharge Account</button>
                        <button onClick={() => setIsInsufficient(false)} className="py-2 text-gray-700 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.4em]">Dismiss</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
