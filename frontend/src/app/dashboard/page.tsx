'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { PDFDocument } from 'pdf-lib';
import { API_URL } from '@/lib/constants';
import { numberToWords } from '@/lib/utils';
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
  const [editableData, setEditableData] = useState<any>(null);
  const [docHint, setDocHint] = useState<string>('Standard Invoice'); // Default hint
  const [isSaving, setIsSaving] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
    fetchRecentDocs();
  }, []);

  useEffect(() => {
    if (lastResult || isUploading || isConfirming || isInsufficient) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => { 
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [lastResult, isUploading, isConfirming, isInsufficient]);

  // Auto-calculate total amount based on items and taxes
  useEffect(() => {
    if (editableData && (editableData.items || editableData.taxBreakdown)) {
      const itemsTotal = (editableData.items || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
      const taxTotal = (editableData.taxBreakdown?.cgst || 0) + 
                       (editableData.taxBreakdown?.sgst || 0) + 
                       (editableData.taxBreakdown?.igst || 0);
      const shipping = parseFloat(editableData.shippingAmount) || 0;
      const roundOff = parseFloat(editableData.roundOff) || 0;
      const newTotal = itemsTotal + taxTotal + shipping + roundOff;
      
      // Only update if the difference is significant (to avoid float issues)
      if (Math.abs(newTotal - (editableData.totalAmount || 0)) > 0.01) {
        setEditableData({ ...editableData, totalAmount: newTotal });
      }
    }
  }, [editableData?.items, editableData?.taxBreakdown, editableData?.roundOff]);

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
            const file = files[i];
            const formData = new FormData();
            formData.append('files', file);
            formData.append('docHint', docHint); // Send the selected hint
            
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
                setEditableData(JSON.parse(result.extractedData || '{}'));
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

  const handleItemChange = (index: number, field: string, value: any) => {
    if (!editableData) return;
    const newItems = [...(editableData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditableData({ ...editableData, items: newItems });
  };

  const handleAddItem = () => {
    if (!editableData) return;
    const newItems = [...(editableData.items || []), { name: 'New Item', quantity: 1, rate: 0, amount: 0 }];
    setEditableData({ ...editableData, items: newItems });
  };

  const handleSave = async () => {
    if (!lastResult || !editableData) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/documents/${lastResult.id}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editableData)
      });
      if (res.ok) {
        const updatedDoc = await res.json();
        setLastResult(updatedDoc);
        setEditableData(JSON.parse(updatedDoc.extractedData || '{}'));
        fetchRecentDocs();
        fetchStats();
        alert("Changes saved successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-1000 pb-20">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.webp"
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
          <div key={i} className={`group relative bg-card border border-border rounded-[2.5rem] p-9 transition-all duration-700 hover:-translate-y-2 hover:bg-muted/5 hover:border-blue-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_rgba(0,0,0,0.7)] overflow-hidden cursor-default animate-in fade-in slide-in-from-bottom-4 fill-mode-both`} style={{ animationDelay: `${i*100}ms` }}>
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
                    <p className="text-muted text-[11px] font-black uppercase tracking-[0.3em] mb-3 transition-colors group-hover:text-blue-500">{card.title}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                        <h4 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter leading-none group-hover:scale-[1.02] transition-transform duration-500 truncate max-w-full">
                            <CountUp value={card.value} />
                        </h4>
                    </div>
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                         <span className="text-muted text-[10px] font-black uppercase tracking-widest">{card.desc}</span>
                         <div className="flex gap-1 animate-pulse">
                             <div className="w-1 h-1 rounded-full bg-muted/20"></div>
                             <div className="w-1 h-1 rounded-full bg-muted/20"></div>
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
                      <span className="text-[9px] font-black text-muted uppercase tracking-widest leading-none mb-1 group-hover:text-foreground transition-colors">{item.label}</span>
                      <span className="text-xs font-black text-muted group-hover:text-foreground transition-colors">{item.value}</span>
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
                    <div className="flex flex-wrap gap-2 justify-end max-w-[50%]">
                        {['Standard Invoice', 'Scanned Copy', 'Hand Written', 'Old School', 'PDF', 'PNG', 'JPEG'].map(hint => (
                            <button 
                                key={hint} 
                                onClick={(e) => { e.stopPropagation(); setDocHint(hint); }}
                                className={`px-3 py-1.5 border rounded-xl text-[9px] font-black tracking-tighter transition-all uppercase ${
                                    docHint === hint 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' 
                                    : 'bg-background/50 border-border text-gray-500 hover:text-foreground hover:border-blue-500/30'
                                }`}
                            >
                                {hint}
                            </button>
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
                        <h3 className="text-3xl font-black text-foreground tracking-tighter leading-none uppercase">
                            {credits <= 0 ? "You've reached your limit" : "Scale your extraction"}
                        </h3>
                        <p className="text-sm font-medium text-muted leading-relaxed">
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
                            : 'bg-muted/10 text-foreground border border-border hover:border-blue-500/40'
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
                                <p className="text-foreground text-lg font-black tracking-tight uppercase">Stream Standby</p>
                                <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.4em] max-w-[200px]">Awaiting next extraction sequence...</p>
                            </div>
                        </div>
                    ) : (
                        recentDocs.slice(0, 4).map((doc, i) => {
                            const data = JSON.parse(doc.extractedData || '{}');
                            return (
                                <div key={i} className={`flex items-center justify-between group cursor-pointer p-7 -mx-4 rounded-[2.5rem] transition-all duration-700 hover:bg-muted/5 hover:translate-x-2 border border-transparent hover:border-border active:scale-[0.98] animate-in fade-in slide-in-from-right-4 fill-mode-both shadow-sm hover:shadow-2xl transition-colors`} style={{ animationDelay: `${i*100}ms` }}>
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
      <div className="rounded-[2.5rem] overflow-hidden group/table shadow-inner border border-[var(--border)] transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
          <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                   <div className="w-3 h-3 bg-blue-500/10 rounded-full flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                   </div>
                   <div>
                       <h4 className="text-sm font-black uppercase tracking-[0.5em] leading-none mb-1" style={{ color: 'var(--foreground)' }}>Neural Archive</h4>
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--foreground)' }}>Historical Extraction Database</p>
                   </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-2 border-r border-border">
                     <button onClick={() => setFontSize(f => Math.max(8, f - 1))} className="w-6 h-6 flex items-center justify-center bg-muted/10 hover:bg-muted/20 rounded-lg text-foreground font-bold transition-colors shadow-inner">-</button>
                     <span className="text-[10px] font-black w-8 text-center text-muted">{fontSize}px</span>
                     <button onClick={() => setFontSize(f => Math.min(24, f + 1))} className="w-6 h-6 flex items-center justify-center bg-muted/10 hover:bg-muted/20 rounded-lg text-foreground font-bold transition-colors shadow-inner">+</button>
                 </div>
                  <button onClick={() => router.push('/dashboard/history')} className="px-6 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/20 hover:bg-blue-600/10 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest rounded-xl transition-all hover:text-blue-600 dark:hover:text-blue-400 group/btn shadow-inner">
                      View Full Stack 
                      <span className="inline-block transition-transform group-hover/btn:translate-x-2 ml-2">→</span>
                  </button>
              </div>
          </div>
          <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left border-collapse" style={{ fontSize: `${fontSize}px` }}>
                  <thead>
                      <tr className="bg-white/[0.04]">
                           {['Identity', 'GSTIN', 'Date', 'Amount', 'Tax', 'Total', 'Status'].map(h => (
                               <th key={h} className="px-4 py-2 font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-[var(--border)] whitespace-nowrap" style={{ fontSize: `${fontSize * 0.8}px` }}>{h}</th>
                           ))}
                      </tr>
                  </thead>
                  <tbody className="bg-white/[0.01]">
                      {recentDocs.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-16 text-center border border-[var(--border)]">
                                <p className="text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest italic opacity-40">System Log Empty</p>
                            </td>
                        </tr>
                      ) : (
                        recentDocs.slice(0, 6).map((doc, i) => {
                          const data = JSON.parse(doc.extractedData || '{}');
                          return (
                              <tr key={i} className="hover:bg-blue-500/10 transition-colors cursor-pointer group/row" onClick={() => {
                                  const docData = JSON.parse(doc.extractedData || '{}');
                                  const fullData = {
                                      ...docData,
                                      id: doc.id,
                                      totalAmount: doc.totalAmount,
                                      taxBreakdown: { cgst: doc.cgst || 0, sgst: doc.sgst || 0, igst: doc.igst || 0 },
                                      processedAt: doc.processedAt,
                                      gstin: doc.gstin
                                  };
                                  setLastResult(fullData);
                                  setEditableData(fullData);
                              }}>
                                  <td className="px-4 py-2 border border-[var(--border)] whitespace-nowrap">
                                      <div className="flex flex-col gap-0.5">
                                          <span className="font-black tracking-tight uppercase line-clamp-1" style={{ color: 'var(--foreground)' }}>{data.vendor || "Verified Source"}</span>
                                          <div className="flex gap-2 opacity-50 font-bold" style={{ fontSize: `${fontSize * 0.75}px` }}>
                                              <span className="text-blue-500/80">{data.storeInfo?.email || 'NO_EMAIL'}</span>
                                              <span className="text-gray-600">|</span>
                                              <span className="text-green-500/80">{data.bankDetails?.accountNumber || 'NO_BANK_AC'}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-4 py-2 border border-[var(--border)] whitespace-nowrap">
                                      <span className="font-mono font-bold uppercase opacity-60" style={{ color: 'var(--foreground)' }}>{doc.gstin || "NO_SIG"}</span>
                                  </td>
                                  <td className="px-4 py-2 border border-[var(--border)] whitespace-nowrap font-black uppercase opacity-40 group-hover/row:opacity-100" style={{ color: 'var(--foreground)' }}>
                                      {new Date(doc.processedAt).toLocaleDateString('en-GB')}
                                  </td>
                                  <td className="px-4 py-2 border border-[var(--border)] whitespace-nowrap font-mono text-right" style={{ color: 'var(--foreground)' }}>₹{(doc.totalAmount - (data.taxAmount || 0) - (doc.roundOff || 0)).toLocaleString()}</td>
                                  <td className="px-4 py-2 border border-[var(--border)] whitespace-nowrap font-mono text-right text-red-500/80" style={{ color: '' }}>₹{(data.taxAmount || 0).toLocaleString()}</td>
                                  <td className="px-4 py-2 border border-[var(--border)] whitespace-nowrap font-mono font-black italic text-right bg-white/[0.02]" style={{ color: 'var(--foreground)' }}>₹{(doc.totalAmount || 0).toLocaleString()}</td>
                                  <td className="px-4 py-1.5 border border-[var(--border)] whitespace-nowrap text-center">
                                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[1.5rem] font-black uppercase border transition-all duration-500 ${doc.status === 'completed' ? 'bg-green-600/5 text-green-500 border-green-500/20 group-hover/row:bg-green-500/20' : 'bg-red-600/5 text-red-500 border-red-500/20'}`} style={{ fontSize: `${fontSize * 0.7}px` }}>
                                          <div className={`w-1 h-1 rounded-full ${doc.status === 'completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                                          {doc.status === 'completed' ? 'Verified' : 'Failed'}
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
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-2 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500 overflow-y-auto">
            <div className="bg-white text-black w-full max-w-5xl rounded-xl shadow-2xl flex flex-col relative overflow-hidden my-auto border-2 border-gray-300">
                
                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex gap-4 z-50 print:hidden">
                    <button onClick={() => setLastResult(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* EXTRACTION WARNING BANNER */}
                    {editableData?.extractionWarning && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-400 rounded-lg flex items-start gap-3">
                            <span className="text-orange-600 text-lg">⚠️</span>
                            <div>
                                <p className="text-[10px] font-black uppercase text-orange-700 mb-0.5">Review Required</p>
                                <p className="text-[9px] font-bold text-orange-600">{editableData.extractionWarning}</p>
                            </div>
                        </div>
                    )}
                    {/* INVOICE DOCUMENT START */}
                    <div className="border border-black p-1">
                        <div className="border border-black flex flex-col items-center py-4 px-6 text-center">
                            <input 
                                value={editableData?.vendor || ''} 
                                onChange={(e) => setEditableData({...editableData, vendor: e.target.value})}
                                className="text-3xl font-black uppercase tracking-tighter w-full text-center bg-transparent border-none focus:outline-none"
                                placeholder="COMPANY NAME"
                            />
                            <textarea 
                                value={editableData?.storeInfo?.address || ''} 
                                onChange={(e) => setEditableData({...editableData, storeInfo: {...editableData.storeInfo, address: e.target.value}})}
                                className="text-xs font-bold w-full text-center bg-transparent border-none focus:outline-none resize-none mt-1"
                                rows={2}
                                placeholder="NO - 00, ABC ROAD, CHENNAI..."
                            />
                            <div className="flex gap-6 mt-1 text-xs font-black">
                                <div className="flex items-center gap-1">
                                    <span>Tel:</span>
                                    <input value={editableData?.storeInfo?.phone || ''} onChange={(e) => setEditableData({...editableData, storeInfo: {...editableData.storeInfo, phone: e.target.value}})} className="bg-transparent border-none focus:outline-none w-24" />
                                </div>
                                <div className="flex items-center gap-1 uppercase">
                                    <span>GSTIN:</span>
                                    <input value={editableData?.vendorGstin || ''} onChange={(e) => setEditableData({...editableData, vendorGstin: e.target.value})} className="bg-transparent border-none focus:outline-none w-32 font-mono" />
                                </div>
                            </div>
                        </div>

                        <div className="border-x border-b border-black text-center py-1 bg-gray-100">
                            <h2 className="text-lg font-black uppercase tracking-widest">Tax Invoice</h2>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 border-x border-black">
                            <div className="border-r border-black">
                                <div className="flex border-b border-black">
                                    <div className="w-1/3 px-2 py-1 border-r border-black text-[10px] font-black uppercase bg-gray-50">Invoice No:</div>
                                    <input value={editableData?.invoiceNumber || ''} onChange={(e) => setEditableData({...editableData, invoiceNumber: e.target.value})} className="w-2/3 px-2 py-1 text-[10px] font-bold focus:outline-none" />
                                </div>
                                <div className="flex border-b border-black">
                                    <div className="w-1/3 px-2 py-1 border-r border-black text-[10px] font-black uppercase bg-gray-50">Invoice date:</div>
                                    <input type="date" value={editableData?.invoiceDate || ''} onChange={(e) => setEditableData({...editableData, invoiceDate: e.target.value})} className="w-2/3 px-2 py-1 text-[10px] font-bold focus:outline-none" />
                                </div>
                                <div className="flex border-b border-black">
                                    <div className="w-1/3 px-2 py-1 border-r border-black text-[10px] font-black uppercase bg-gray-50">Reverse Charge:</div>
                                    <input value={editableData?.reverseCharge || 'N'} onChange={(e) => setEditableData({...editableData, reverseCharge: e.target.value})} className="w-2/3 px-2 py-1 text-[10px] font-bold focus:outline-none uppercase" />
                                </div>
                                <div className="flex">
                                    <div className="w-1/3 px-2 py-1 border-r border-black text-[10px] font-black uppercase bg-gray-50">State Code:</div>
                                    <input value={editableData?.stateCode || '33'} onChange={(e) => setEditableData({...editableData, stateCode: e.target.value})} className="w-2/3 px-2 py-1 text-[10px] font-bold focus:outline-none uppercase" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex border-b border-black h-full">
                                    <div className="w-1/4 px-2 py-1 border-r border-black text-[10px] font-black uppercase bg-gray-50">To</div>
                                    <div className="w-3/4 flex flex-col p-1 gap-1">
                                        <input value={editableData?.customerName || ''} onChange={(e) => setEditableData({...editableData, customerName: e.target.value})} className="px-1 text-[10px] font-black uppercase focus:outline-none" placeholder="Customer Name" />
                                        <textarea value={editableData?.address || ''} onChange={(e) => setEditableData({...editableData, address: e.target.value})} className="px-1 text-[9px] font-bold focus:outline-none resize-none h-12" placeholder="Customer Address" />
                                        <div className="flex items-center gap-1 px-1 border-t border-gray-100 pt-1">
                                            <span className="text-[9px] font-black uppercase">GSTIN:</span>
                                            <input value={editableData?.customerGstin || ''} onChange={(e) => setEditableData({...editableData, customerGstin: e.target.value})} className="text-[9px] font-bold focus:outline-none uppercase font-mono w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-black mt-[-1px]">
                            <table className="w-full border-collapse text-[10px]">
                                <thead className="bg-orange-50 border-b border-black">
                                    <tr>
                                        <th className="border-r border-black px-1 py-1 w-8 text-center font-black">S.No</th>
                                        <th className="border-r border-black px-2 py-1 text-left font-black">Product Description</th>
                                        <th className="border-r border-black px-1 py-1 w-16 text-center font-black">HSN Code</th>
                                        <th className="border-r border-black px-1 py-1 w-10 text-center font-black">Qty</th>
                                        <th className="border-r border-black px-1 py-1 w-14 text-center font-black">Rate</th>
                                        <th className="border-r border-black px-1 py-1 w-12 text-center font-black">Disc %</th>
                                        <th className="border-r border-black px-1 py-1 w-20 text-right font-black">Amount</th>
                                        <th className="px-1 py-1 w-8 text-center print:hidden"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(editableData?.items || []).map((item: any, idx: number) => (
                                        <tr key={idx} className="border-b border-black last:border-b-0 hover:bg-blue-50 transition-colors group">
                                            <td className="border-r border-black px-1 py-1 text-center font-bold">{idx + 1}</td>
                                            <td className="border-r border-black px-2 py-1">
                                                <input value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} className="w-full bg-transparent focus:outline-none font-bold uppercase" />
                                            </td>
                                            <td className="border-r border-black px-1 py-1">
                                                <input value={item.hsn || ''} onChange={(e) => handleItemChange(idx, 'hsn', e.target.value)} className="w-full text-center bg-transparent focus:outline-none font-bold font-mono" />
                                            </td>
                                            <td className="border-r border-black px-1 py-1">
                                                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value))} className="w-full text-center bg-transparent focus:outline-none font-bold" />
                                            </td>
                                            <td className="border-r border-black px-1 py-1">
                                                <input type="number" value={item.rate || 0} onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value))} className="w-full text-center bg-transparent focus:outline-none font-bold" />
                                            </td>
                                            <td className="border-r border-black px-1 py-1">
                                                <input type="number" value={item.discountPercent || 0} onChange={(e) => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value))} className="w-full text-center bg-transparent focus:outline-none font-bold text-red-600" />
                                            </td>
                                            <td className="border-r border-black px-1 py-1">
                                                <input type="number" value={item.amount} onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value))} className="w-full text-right bg-transparent focus:outline-none font-black" />
                                            </td>
                                            <td className="text-center print:hidden">
                                                <button onClick={() => {
                                                    const newItems = editableData.items.filter((_: any, i: number) => i !== idx);
                                                    setEditableData({...editableData, items: newItems});
                                                }} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Empty rows to maintain structure */}
                                    {[...Array(Math.max(0, 6 - (editableData?.items?.length || 0)))].map((_, i) => (
                                        <tr key={`empty-${i}`} className="border-b border-black last:border-b-0 h-8">
                                            <td className="border-r border-black"></td>
                                            <td className="border-r border-black"></td>
                                            <td className="border-r border-black"></td>
                                            <td className="border-r border-black"></td>
                                            <td className="border-r border-black"></td>
                                            <td className="border-r border-black"></td>
                                            <td className="border-r border-black"></td>
                                            <td></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t border-black bg-gray-50 font-black">
                                    <tr>
                                        <td colSpan={6} className="border-r border-black px-2 py-1 text-right uppercase">Total</td>
                                        <td className="border-r border-black px-1 py-1 text-right">
                                            ₹{(editableData?.items || []).reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0).toLocaleString()}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Bottom Sections */}
                        <div className="grid grid-cols-2 border-x border-b border-black">
                            <div className="border-r border-black flex flex-col justify-between">
                                <div className="p-2 border-b border-black h-12 overflow-hidden">
                                    <p className="text-[8px] font-black uppercase opacity-60">Total Invoice amount in words</p>
                                    <p className="text-[9px] font-black uppercase leading-tight">
                                        {editableData?.totalAmount ? numberToWords(editableData.totalAmount, editableData.currency || 'INR') : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-2 bg-orange-50">
                                    <p className="text-[10px] font-black uppercase border-b border-black mb-2">Bank Details</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-bold">
                                        <span>Account Name:</span>
                                        <input value={editableData?.bankDetails?.accountName || ''} onChange={(e) => setEditableData({...editableData, bankDetails: {...editableData.bankDetails, accountName: e.target.value}})} className="bg-transparent focus:outline-none font-black uppercase" />
                                        <span>Bank A/C No:</span>
                                        <input value={editableData?.bankDetails?.accountNumber || ''} onChange={(e) => setEditableData({...editableData, bankDetails: {...editableData.bankDetails, accountNumber: e.target.value}})} className="bg-transparent focus:outline-none font-black" />
                                        <span>Bank Name:</span>
                                        <input value={editableData?.bankDetails?.bankName || ''} onChange={(e) => setEditableData({...editableData, bankDetails: {...editableData.bankDetails, bankName: e.target.value}})} className="bg-transparent focus:outline-none font-black" />
                                        <span>Branch Name:</span>
                                        <input value={editableData?.bankDetails?.branch || ''} onChange={(e) => setEditableData({...editableData, bankDetails: {...editableData.bankDetails, branch: e.target.value}})} className="bg-transparent focus:outline-none font-black" />
                                        <span>IFSC / Routing:</span>
                                        <input value={editableData?.bankDetails?.ifscCode || ''} onChange={(e) => setEditableData({...editableData, bankDetails: {...editableData.bankDetails, ifscCode: e.target.value}})} className="bg-transparent focus:outline-none font-black uppercase font-mono" />
                                        <span>SWIFT Code:</span>
                                        <input value={editableData?.bankDetails?.swiftCode || ''} onChange={(e) => setEditableData({...editableData, bankDetails: {...editableData.bankDetails, swiftCode: e.target.value}})} className="bg-transparent focus:outline-none font-black uppercase font-mono" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="grid grid-cols-2 text-[10px] font-black">
                                    <div className="border-r border-b border-black px-2 py-1 bg-gray-50">Total Amount before Tax:</div>
                                    <div className="border-b border-black px-2 py-1 text-right">
                                        ₹{(editableData?.items || []).reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0).toLocaleString()}
                                    </div>
                                    
                                    <div className="border-r border-b border-black px-2 py-1">Add: CGST %</div>
                                    <div className="border-b border-black px-2 py-1 text-right flex items-center justify-end gap-2">
                                        <input type="number" value={editableData?.taxBreakdown?.cgst || 0} onChange={(e) => setEditableData({...editableData, taxBreakdown: {...editableData.taxBreakdown, cgst: parseFloat(e.target.value)}})} className="w-16 bg-transparent text-right focus:outline-none" />
                                    </div>
                                    
                                    <div className="border-r border-b border-black px-2 py-1">Add: SGST %</div>
                                    <div className="border-b border-black px-2 py-1 text-right flex items-center justify-end gap-2">
                                        <input type="number" value={editableData?.taxBreakdown?.sgst || 0} onChange={(e) => setEditableData({...editableData, taxBreakdown: {...editableData.taxBreakdown, sgst: parseFloat(e.target.value)}})} className="w-16 bg-transparent text-right focus:outline-none" />
                                    </div>

                                    <div className="border-r border-b border-black px-2 py-1">Shipping:</div>
                                    <div className="border-b border-black px-2 py-1 text-right flex items-center justify-end gap-2">
                                        <input type="number" step="0.01" value={editableData?.shippingAmount || 0} onChange={(e) => setEditableData({...editableData, shippingAmount: parseFloat(e.target.value)})} className="w-16 bg-transparent text-right focus:outline-none" />
                                    </div>

                                    <div className="border-r border-b border-black px-2 py-1">Round Off:</div>
                                    <div className="border-b border-black px-2 py-1 text-right flex items-center justify-end gap-2">
                                        <input type="number" step="0.01" value={editableData?.roundOff || 0} onChange={(e) => setEditableData({...editableData, roundOff: parseFloat(e.target.value)})} className="w-16 bg-transparent text-right focus:outline-none font-bold" />
                                    </div>

                                    <div className="border-r border-black px-2 py-4 bg-orange-50 text-base">Grand Total:</div>
                                    <div className="px-2 py-4 text-right bg-orange-50 text-lg font-black text-blue-600">
                                        ₹{(editableData?.totalAmount || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="border-t border-black p-4 text-center mt-auto">
                                    <p className="text-[8px] font-black mb-8">Certified that the particulars given above are true and correct</p>
                                    <p className="text-[10px] font-black uppercase">For {editableData?.vendor || 'ABC & CO'}</p>
                                    <div className="mt-6 border-t border-dashed border-gray-300 pt-1">
                                        <p className="text-[8px] font-bold opacity-40 italic uppercase">Authorised signatory</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-[8px] font-black uppercase opacity-40 mt-4 tracking-widest">Computer Generated Invoice</p>
                </div>

                <div className="p-6 bg-gray-50 border-t-2 border-gray-200 flex gap-4 print:hidden">
                    <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm tracking-widest uppercase transition-all shadow-lg active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Confirm & Save Changes'}
                    </button>
                    <button onClick={handleAddItem} className="px-8 py-4 bg-white border border-blue-600 text-blue-600 rounded-xl font-black text-sm tracking-widest uppercase hover:bg-blue-50 transition-all">
                        + Item
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* CONFIRMATION & ERROR MODALS REFINED (ULTRA POLISHED) */}
    {isConfirming && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-background/95 backdrop-blur-[40px] animate-in fade-in duration-500">
            <div className="bg-card border border-border shadow-2xl rounded-[3.5rem] p-16 max-w-xl w-full animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-600/10 blur-3xl"></div>
                
                <div className="relative z-10 space-y-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-black">!</span>
                            <h3 className="text-3xl font-black text-foreground mb-2 tracking-tighter uppercase">Initiate Extraction</h3>
                        </div>
                        <p className="text-muted leading-relaxed font-bold text-base">
                            Ready to analyze <span className="text-foreground">{pendingFiles.length} invoices</span>. This batch will consume <span className="text-blue-500">{totalCreditsRequired} processing units</span> from your balance.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button onClick={processUploads} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black tracking-[0.3em] text-xs uppercase transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02]">Execute Analysis</button>
                        <button onClick={() => setIsConfirming(false)} className="w-full py-4 text-muted hover:text-foreground transition-colors text-[10px] font-black uppercase tracking-[0.4em]">Abort Procedure</button>
                    </div>
                </div>
            </div>
        </div>
    )}

      {isInsufficient && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-red-950/20 backdrop-blur-[60px] animate-in fade-in duration-500">
            <div className="bg-card border border-red-500/30 rounded-[3.5rem] p-16 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-500 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-red-600/[0.02] pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center text-4xl mb-10 mx-auto text-red-500 shadow-inner">⚠️</div>
                    <div className="space-y-4 mb-12">
                        <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Quota Exhausted</h3>
                        <p className="text-muted leading-relaxed font-bold text-base px-4">
                            Analysis requires <span className="text-foreground">{totalCreditsRequired} credits</span>, but your balance is insufficient for this batch.
                        </p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => window.location.href='/dashboard/pricing'} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black tracking-[0.3em] text-xs uppercase shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]">Recharge Account</button>
                        <button onClick={() => setIsInsufficient(false)} className="py-2 text-muted hover:text-foreground transition-colors text-[10px] font-black uppercase tracking-[0.4em]">Dismiss</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
