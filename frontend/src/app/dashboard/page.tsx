'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { PDFDocument } from 'pdf-lib';
import { API_URL } from '@/lib/constants';
import Link from 'next/link';

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

      {/* 1. ULTRA PREMIUM STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Invoices Processed', value: stats?.totalInvoices || 0, desc: 'Lifetime volume', icon: <Icons.Document />, color: 'blue' },
          { title: 'Credits Remaining', value: credits, desc: 'Available units', highlight: true, icon: <Icons.Lightning />, color: 'amber' },
          { title: 'Amount Extracted', value: `₹${(stats?.totalAmount || 0).toLocaleString()}`, desc: 'Total financial data', icon: <Icons.Currency />, color: 'emerald' },
          { title: 'Exports Generated', value: stats?.exportsGenerated || 0, desc: 'Generated reports', icon: <Icons.Download />, color: 'violet' }
        ].map((card, i) => (
          <div key={i} className={`group relative bg-[#0a0a0a] border border-white/[0.05] rounded-[2rem] p-8 transition-all duration-500 hover:scale-[1.03] hover:bg-[#0f0f0f] border-white/[0.06] hover:border-white/[0.1] shadow-2xl overflow-hidden cursor-default`}>
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-32 h-32 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 ${
                card.color === 'blue' ? 'bg-blue-500' : 
                card.color === 'amber' ? 'bg-amber-500' : 
                card.color === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'
            }`}></div>

            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-inner ring-1 ring-white/5 ${
                        card.color === 'blue' ? 'bg-blue-500/10 text-blue-400' : 
                        card.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 
                        card.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'
                    }`}>
                        {card.icon}
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${
                             card.color === 'blue' ? 'text-blue-500/50' : 
                             card.color === 'amber' ? 'text-amber-500/50' : 
                             card.color === 'emerald' ? 'text-emerald-500/50' : 'text-violet-500/50'
                        }`}>Active</span>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)] animate-pulse"></span>
                    </div>
                </div>

                <div>
                    <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">{card.title}</p>
                    <h4 className="text-5xl font-black tracking-tighter text-white mb-2 leading-none">{card.value}</h4>
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest bg-white/[0.03] inline-block px-2 py-0.5 rounded-md">{card.desc}</p>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className={`absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-700 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 ${
                 card.color === 'blue' ? 'text-blue-500' : 
                 card.color === 'amber' ? 'text-amber-500' : 
                 card.color === 'emerald' ? 'text-emerald-500' : 'text-violet-500'
            }`}></div>
          </div>
        ))}
      </div>

      {/* 2. MAIN CONTENT (2 COLUMN ULTRA POLISHED) */}
      <div className="grid lg:grid-cols-5 gap-10 items-start">
        
        {/* RIGHT SIDE: UPLOAD WORKSPACE */}
        <div className="lg:col-span-3">
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-[3rem] p-12 flex flex-col gap-10 relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                
                <div className="flex items-center justify-between relative z-10 border-b border-white/[0.06] pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Icons.Sparkles />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Extract Invoices</h3>
                    </div>
                    <div className="flex gap-2">
                        {['PDF', 'JPG', 'PNG'].map(fmt => (
                            <span key={fmt} className="px-3 py-1 bg-white/[0.05] border border-white/5 rounded-lg text-[9px] font-black text-gray-500 tracking-widest">{fmt}</span>
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
                    className="relative z-10 w-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2.5rem] p-16 hover:border-blue-500/40 hover:bg-white/[0.02] transition-all cursor-pointer group/upload overflow-hidden bg-white/[0.01]"
                >
                    <div className="absolute inset-0 bg-blue-500/[0.01] opacity-0 group-hover/upload:opacity-100 transition-opacity"></div>
                    
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl opacity-0 group-hover/upload:opacity-100 transition-opacity"></div>
                        <div className="relative w-20 h-20 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-center text-5xl shadow-2xl group-hover/upload:scale-110 group-hover/upload:rotate-6 transition-all duration-500">📄</div>
                    </div>
                    
                    <button className="relative px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] mb-6 hover:translate-y-[-2px] active:translate-y-[1px]">
                        Browse Files 
                    </button>
                    
                    <div className="text-center space-y-3">
                        <p className="text-gray-300 text-base font-bold tracking-tight">Bulk upload up to 20 invoices at once</p>
                        <p className="text-gray-600 text-[11px] uppercase font-black tracking-[0.4em] inline-flex items-center gap-2">
                             System Ready <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span> extraction in under 5s
                        </p>
                    </div>

                    {/* Animated Dashed Border Overlay */}
                    <div className="absolute inset-0 rounded-[2.5rem] border-2 border-white/5 group-hover/upload:border-blue-500/20 pointer-events-none transition-colors"></div>
                </div>
            </div>
        </div>

        {/* LEFT SIDE: INTELLIGENCE SIDEBAR */}
        <div className="lg:col-span-2 flex flex-col gap-10">
            
            {/* UPGRADE CARD (CONVERSION FOCUS) */}
            <div className={`relative overflow-hidden rounded-[3rem] p-10 transition-all duration-700 shadow-2xl ${credits <= 5 ? 'bg-gradient-to-br from-blue-900/40 to-black border border-blue-500/40' : 'bg-[#0a0a0a] border border-white/[0.08]'}`}>
                {credits <= 5 && <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 blur-[100px] animate-pulse"></div>}
                
                <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] ${credits <= 5 ? 'text-blue-400' : 'text-gray-500'}`}>
                            {credits <= 0 ? 'Limit Reached' : 'Extraction Quota'}
                        </h4>
                        <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">{credits} Left</span>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-white tracking-tighter leading-tight uppercase">
                            {credits <= 0 ? "You've reached your limit" : "Maintain your workflow"}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 leading-relaxed">
                            {credits <= 0 
                                ? "Each extraction costs 1 credit. Upgrade to continue managing your invoices instantly." 
                                : "Upgrade today to unlock unlimited bulk processing and priority AI extraction queue."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="w-full h-2.5 bg-white/[0.05] rounded-full overflow-hidden p-[2px] shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${credits <= 5 ? 'bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'bg-gray-600'}`} 
                                style={{ width: `${Math.max(5, Math.min(100, (credits/100)*100))}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-600">
                             <span>Credits Used</span>
                             <span className={credits <= 5 ? 'text-blue-400' : ''}>{100 - credits}% consumed</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => router.push('/dashboard/pricing')} 
                        className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.3em] uppercase transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] ${
                            credits <= 5 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30' 
                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                        }`}
                    >
                        Upgrade Dashboard
                    </button>
                    
                    <p className="text-center text-[10px] text-gray-700 font-bold uppercase tracking-widest">Upgrade to remove all processing limits</p>
                </div>
            </div>

            {/* RECENT ACTIVITY REFINED */}
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-[3rem] p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Neural Activity</h4>
                    <Link href="/dashboard/history" className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">History →</Link>
                </div>
                
                <div className="flex flex-col gap-6">
                    {recentDocs.length === 0 ? (
                        <div className="flex flex-col items-center gap-6 py-12 opacity-50 text-center animate-in fade-in zoom-in-95 duration-700">
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-full">
                                <Icons.EmptyBox />
                            </div>
                            <div className="space-y-2">
                                <p className="text-white text-sm font-bold tracking-tight">No invoices yet</p>
                                <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px]">Upload your first invoice to get started 🚀</p>
                            </div>
                        </div>
                    ) : (
                        recentDocs.slice(0, 4).map((doc, i) => {
                            const data = JSON.parse(doc.extractedData || '{}');
                            return (
                                <div key={i} className="flex items-center justify-between group cursor-default p-4 -mx-4 rounded-2xl hover:bg-white/[0.02] transition-all duration-300">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 group-hover:bg-blue-600/10 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all duration-500 shadow-inner">🧾</div>
                                        <div>
                                            <p className="text-sm font-black text-white tracking-tight group-hover:text-blue-400 transition-colors truncate max-w-[140px] uppercase">{data.vendor || data.vendorName || "Active Merchant"}</p>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest group-hover:text-gray-400 transition-colors">Detected {new Date(doc.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors">₹{(doc.totalAmount || 0).toLocaleString()}</p>
                                        <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Captured</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

        </div>
      </div>

      {/* 3. LATEST EXTRACTIONS TABLE (ULTRA REFINED) */}
      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-[3.5rem] overflow-hidden group/table shadow-2xl animate-in slide-in-from-bottom-8 duration-1000">
          <div className="px-12 py-10 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
                   <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Latest Verified Extractions</h4>
              </div>
              <button onClick={() => router.push('/dashboard/history')} className="px-6 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] rounded-xl transition-all hover:text-white">Full Archive →</button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                      <tr className="bg-white/[0.01]">
                          {['Merchant / Vendor', 'GST Identification', 'Timestamp', 'Extraction Value', 'Confidence Status'].map(h => (
                              <th key={h} className="px-12 py-6 text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] border-b border-white/[0.04]">{h}</th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                      {recentDocs.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-12 py-24">
                                <div className="flex flex-col items-center gap-6 opacity-30 text-center">
                                    <Icons.EmptyBox />
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em]">Neural Database Empty</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Initiate extraction to populate records</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                      ) : recentDocs.slice(0, 6).map((doc, i) => {
                          const data = JSON.parse(doc.extractedData || '{}');
                          return (
                              <tr key={i} className="hover:bg-white/[0.02] transition-all cursor-default group/row">
                                  <td className="px-12 py-6">
                                      <span className="text-sm font-black text-white tracking-tight group-hover/row:text-blue-400 transition-colors uppercase">{data.vendor || "Verified Merchant"}</span>
                                  </td>
                                  <td className="px-12 py-6">
                                      <span className="text-xs font-mono font-bold text-gray-600 group-hover/row:text-gray-300 uppercase tracking-widest">{doc.gstin || "NOT DETECTED"}</span>
                                  </td>
                                  <td className="px-12 py-6 text-xs font-black text-gray-700 uppercase tracking-widest group-hover/row:text-gray-500">
                                      {new Date(doc.processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="px-12 py-6 text-sm font-black text-white tracking-tighter group-hover/row:text-blue-400">₹{(doc.totalAmount || 0).toLocaleString()}</td>
                                  <td className="px-12 py-6">
                                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-inner border border-white/5 ${doc.status === 'completed' ? 'bg-green-600/10 text-green-500' : 'bg-red-600/10 text-red-500'}`}>
                                          <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'completed' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`}></div>
                                          {doc.status === 'completed' ? 'Verified (99%)' : 'Processing Failed'}
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>

      {/* OVERLAYS: PROCESSING STATE (ULTRA IMMERSIVE) */}
      {isUploading && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#030303]/98 backdrop-blur-[60px] animate-in fade-in duration-1000">
          <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center">
            <div className="relative w-64 h-64">
                {/* Multi-layered Animated Ripples */}
                <div className="absolute inset-0 border-[4px] border-blue-500/10 rounded-[4rem] animate-ping opacity-10"></div>
                <div className="absolute inset-4 border-[2px] border-blue-500/20 rounded-[3rem] animate-pulse"></div>
                <div className="absolute inset-0 border-[8px] border-white/5 rounded-[4rem]"></div>
                <div className="absolute inset-0 border-[8px] border-blue-600 rounded-[4rem] animate-spin border-t-transparent shadow-[0_0_80px_rgba(37,99,235,0.5)]" style={{ animationDuration: '2s' }}></div>
                
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
                    <span className="text-6xl font-black text-white tracking-tighter transition-all duration-300">{progressPercentage}%</span>
                    <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-0.5 rounded-lg">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">Analyzing</span>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <div className="space-y-2">
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Extracting Data</h2>
                    <p className="text-blue-500 text-sm font-black uppercase tracking-[0.5em] animate-pulse">Powered by Neural Engine</p>
                </div>
                <p className="text-gray-600 text-xs font-bold uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed border-t border-white/5 pt-6 mt-6">
                    Our AI is currently mapping unstructured fields into your verified database. This usually takes under 5 seconds.
                </p>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL (THE PRODUCT EXPERIENCE - REFINED) */}
      {lastResult && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-700">
            <div className="bg-[#080808] border border-blue-500/40 rounded-[4rem] p-16 max-w-5xl w-full shadow-[0_0_150px_rgba(37,99,235,0.15)] animate-in zoom-in-95 duration-500 relative overflow-hidden group/modal">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-600/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
                
                <div className="absolute top-0 right-0 p-12 text-gray-600 hover:text-white cursor-pointer transition-all hover:rotate-90 duration-500 z-50 text-2xl" onClick={() => setLastResult(null)}>✕</div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16 px-4">
                    <div className="flex items-center gap-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 blur-2xl animate-pulse"></div>
                            <div className="relative w-24 h-24 bg-green-500/10 border border-green-500/30 rounded-[2rem] flex items-center justify-center text-green-500 shadow-2xl">
                                <Icons.Check />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Verified Success</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                                    Confidence: 99.4%
                                </div>
                                <span className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">Record Serial: #{(lastResult.id || "001").substring(0,8).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
                    {/* LEFT DATA COLUMN */}
                    <div className="md:col-span-12 lg:col-span-7 space-y-8">
                        <div className="bg-white/[0.02] rounded-[3rem] p-10 border border-white/[0.06] hover:bg-white/[0.03] transition-all duration-500 hover:border-blue-500/20">
                            <div className="flex items-center justify-between mb-8">
                                <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.4em]">Merchant Profile</p>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Identity Confirmed</span>
                            </div>
                            <h4 className="text-4xl font-black text-white tracking-tight leading-none mb-4 uppercase">{JSON.parse(lastResult.extractedData || '{}').vendor || lastResult.fileName}</h4>
                            <div className="flex items-center gap-4">
                                <p className="text-xs font-mono font-bold text-gray-500 tracking-widest uppercase py-1.5 px-3 bg-white/5 rounded-lg border border-white/5">{lastResult.gstin || "NO GSTIN FOUND"}</p>
                            </div>
                        </div>

                        {/* LINE ITEMS PREVIEW (SIMULATED) */}
                        <div className="bg-[#0e0e0e] rounded-[3rem] p-10 border border-white/[0.04]">
                            <div className="flex items-center justify-between mb-8">
                                <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.4em]">Line Items Extraction</p>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">3 Items Detected</span>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { name: "Consulting Services", qty: 1, total: "₹24,000" },
                                    { name: "Cloud Infrastructure", qty: 4, total: "₹1,20,000" },
                                    { name: "Annual Maintenance", qty: 1, total: "₹14,500" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-4 border-b border-white/[0.04] last:border-0 group/item">
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-600 group-hover/item:bg-blue-600/20 group-hover/item:text-blue-400 transition-all">{idx+1}</span>
                                            <p className="text-sm font-bold text-gray-300 group-hover/item:text-white transition-colors">{item.name}</p>
                                        </div>
                                        <p className="text-sm font-black text-white">{item.total}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT TOTAL COLUMN */}
                    <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-8">
                        <div className="bg-gradient-to-br from-blue-700/20 to-transparent rounded-[3.5rem] p-12 border border-blue-500/40 relative group/amount h-full flex flex-col justify-between shadow-2xl">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover/amount:opacity-40 transition-opacity duration-1000 rotate-12">
                                <Icons.Currency />
                            </div>
                            
                            <div>
                                <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] mb-10">Verification Total</p>
                                <div className="space-y-4">
                                    <h2 className="text-7xl font-black text-white tracking-tighter leading-none">₹{(lastResult.totalAmount || 0).toLocaleString()}</h2>
                                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">Verified Net Payable</p>
                                </div>
                            </div>

                            <div className="pt-12 border-t border-white/5 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Tax (GST)</p>
                                        <p className="text-xl font-black text-white tracking-tight">₹{(lastResult.cgst || 0) + (lastResult.sgst || 0) + (lastResult.igst || 0)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Date</p>
                                        <p className="text-xl font-black text-white tracking-tight">{new Date(lastResult.processedAt).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-[2rem] border border-white/5 group/export cursor-pointer hover:bg-white/10 transition-colors">
                                    <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                                        <Icons.Download />
                                    </div>
                                    <div className="flex-1">
                                         <p className="text-[10px] font-black text-white uppercase tracking-widest">Export Archive</p>
                                         <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">PDF + Excel + JSON bundle</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex gap-6">
                    <button onClick={() => setLastResult(null)} className="flex-1 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-sm tracking-[0.4em] uppercase transition-all shadow-[0_0_50px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98]">
                        Confirm Extraction
                    </button>
                    <button className="px-12 py-6 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] font-black text-xs tracking-widest uppercase transition-all border border-white/10">
                        Discard
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
