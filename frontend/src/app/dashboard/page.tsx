'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { PDFDocument } from 'pdf-lib';
import { API_URL } from '@/lib/constants';
import Link from 'next/link';

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
        } else if (files.length <= 1) { // Auto-start if only 1 file
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
    <div className="flex flex-col gap-10 animate-in fade-in duration-700 pb-20">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
      />

      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Invoices Processed', value: stats?.totalInvoices || 0, desc: 'Lifetime historical volume' },
          { title: 'Credits Left', value: credits, desc: 'Available for extraction', highlight: true },
          { title: 'Total Amount Extracted', value: `₹${(stats?.totalAmount || 0).toLocaleString()}`, desc: 'Aggregated invoice value' },
          { title: 'Exports Generated', value: stats?.exportsGenerated || 0, desc: 'Reports and data exports' }
        ].map((card, i) => (
          <div key={i} className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 transition-all hover:bg-white/[0.05] ${card.highlight ? 'ring-1 ring-blue-500/20' : ''}`}>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{card.title}</p>
            <h4 className={`text-3xl font-black tracking-tight mb-2 ${card.highlight ? 'text-blue-400' : 'text-white'}`}>{card.value}</h4>
            <p className="text-gray-600 text-xs font-medium">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 2. MAIN CONTENT (2 COLUMN) */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* LEFT SIDE: UPLOAD (3 COLS) */}
        <div className="lg:col-span-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-[2.5rem] p-10 flex flex-col items-center text-center gap-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <h3 className="text-xl font-black text-white tracking-tight uppercase self-start border-b border-blue-500/30 pb-2 mb-4">Extract New Invoices</h3>
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleFileChange({ target: { files: e.dataTransfer.files } } as any);
                        }
                    }}
                    className="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-12 hover:border-blue-500/30 hover:bg-white/[0.02] transition-all cursor-pointer group/upload"
                >
                    <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover/upload:scale-110 transition-transform">📄</div>
                    <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-sm tracking-tight mb-4 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]">Browse Files</button>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        Drag and drop upload box <br/>
                        <span className="text-gray-600 text-xs mt-1 block tracking-tight">Upload PDF or images. Supports bulk upload up to 20 invoices</span>
                    </p>
                    <div className="mt-6 flex gap-3">
                        {['PDF', 'JPG', 'PNG'].map(fmt => (
                            <span key={fmt} className="px-3 py-1 bg-white/[0.05] rounded-md text-[10px] font-black text-gray-500 tracking-widest">{fmt}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT SIDE: INSIGHTS (2 COLS) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* A. RECENT INVOICES CARD */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-[2rem] p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Recent Invoices</h4>
                    <Link href="/dashboard/history" className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">View All →</Link>
                </div>
                
                <div className="flex flex-col gap-4">
                    {recentDocs.length === 0 ? (
                        <p className="text-gray-600 italic text-sm py-4">No recent activity detected.</p>
                    ) : (
                        recentDocs.slice(0, 3).map((doc, i) => {
                            const data = JSON.parse(doc.extractedData || '{}');
                            return (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm grayscale group-hover:grayscale-0 transition-all">🧾</div>
                                        <div>
                                            <p className="text-sm font-bold text-white tracking-tight">{data.vendor || data.vendorName || "Unknown Invoice"}</p>
                                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{new Date(doc.processedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-white">₹{(doc.totalAmount || 0).toLocaleString()}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* B. USAGE INSIGHTS CARD */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-[2rem] p-8">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">Usage Insights</h4>
                <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-white tracking-tight">You processed {stats?.thisMonthCount || 0} invoices this month</p>
                        <p className="text-xs text-gray-500 font-medium">Saved approximately {(stats?.thisMonthCount || 0) * 2} minutes of manual work</p>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>Credits Usage</span>
                            <span>{credits} / 100</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (credits/100)*100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* 3. BOTTOM SECTION: PREVIEW TABLE */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-[2.5rem] overflow-hidden">
          <div className="px-10 py-8 border-b border-white/[0.06] flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Recent Extracted Data Preview</h4>
              <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Apply Filter</button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                      <tr className="bg-white/[0.02]">
                          {['Vendor Name', 'GST Number', 'Invoice Date', 'Amount', 'Status'].map(h => (
                              <th key={h} className="px-10 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">{h}</th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                      {recentDocs.slice(0, 5).map((doc, i) => {
                          const data = JSON.parse(doc.extractedData || '{}');
                          return (
                              <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                                  <td className="px-10 py-5 text-sm font-bold text-white tracking-tight">{data.vendor || "N/A"}</td>
                                  <td className="px-10 py-5 text-xs font-mono font-bold text-blue-400/60 uppercase">{doc.gstin || "N/A"}</td>
                                  <td className="px-10 py-5 text-xs font-medium text-gray-500 uppercase tracking-widest">{new Date(doc.processedAt).toLocaleDateString()}</td>
                                  <td className="px-10 py-5 text-sm font-black text-white tracking-tight">₹{(doc.totalAmount || 0).toLocaleString()}</td>
                                  <td className="px-10 py-5">
                                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${doc.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                          {doc.status}
                                      </span>
                                  </td>
                              </tr>
                          );
                      })}
                      {recentDocs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-10 py-10 text-center text-gray-600 italic text-sm">No documents processed yet.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* OVERLAYS & MODALS */}
      {isUploading && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-10 w-full max-w-xl text-center">
            <div className="relative w-40 h-40">
                <div className="absolute inset-0 border-[8px] border-blue-500/10 rounded-[2.5rem]"></div>
                <div className="absolute inset-0 border-[8px] border-blue-500 rounded-[2.5rem] animate-spin border-t-transparent shadow-[0_0_40px_rgba(37,99,235,0.4)]" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white">{progressPercentage}%</div>
            </div>
            <div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Analyzing Documents</h2>
                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Neural Data Extraction Active</p>
            </div>
          </div>
        </div>
      )}

      {lastResult && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-blue-500/30 rounded-[3rem] p-12 max-w-2xl w-full shadow-[0_0_80px_rgba(37,99,235,0.15)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-gray-500 hover:text-white cursor-pointer transition-colors" onClick={() => setLastResult(null)}>✕</div>
                
                <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner">✅</div>
                    <div>
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">Invoice Processed</h3>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">AI Extraction Validated</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Vendor Name</p>
                        <p className="text-lg font-bold text-white tracking-tight">{JSON.parse(lastResult.extractedData || '{}').vendor || lastResult.fileName}</p>
                    </div>
                    <div className="bg-blue-600/[0.03] rounded-2xl p-6 border border-blue-500/20">
                        <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest mb-2">Invoice Amount</p>
                        <p className="text-2xl font-black text-blue-400 tracking-tight">₹{(lastResult.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Detected GSTIN</p>
                        <p className="text-sm font-mono font-bold text-white uppercase tracking-wider">{lastResult.gstin || "Not Found"}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Extraction Status</p>
                        <p className="text-sm font-black text-green-500 uppercase tracking-widest">99.9% Confident</p>
                    </div>
                </div>

                <button onClick={() => setLastResult(null)} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)]">Complete Extraction</button>
            </div>
        </div>
      )}

      {/* CONFIRMATION MODALS */}
      {isConfirming && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">Batch Initiation</h3>
                <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                    Neural engine ready to process <span className="text-white font-black">{pendingFiles.length} invoices</span>. This will utilize <span className="text-blue-400 font-black">{totalCreditsRequired} processing credits</span>.
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={processUploads} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black tracking-widest text-xs uppercase transition-all shadow-lg shadow-blue-500/20">Execute Batch Now</button>
                    <button onClick={() => setIsConfirming(false)} className="w-full py-3 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">Abort Process</button>
                </div>
            </div>
        </div>
      )}

      {isInsufficient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0f0f0f] border border-red-500/20 rounded-3xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-3xl mb-8 mx-auto shadow-inner">⚠️</div>
                <h3 className="text-2xl font-black text-white mb-2 text-center tracking-tight uppercase">Credit Depletion</h3>
                <p className="text-gray-500 mb-10 text-center leading-relaxed font-medium">
                    Current batch requires <span className="text-white font-black">{totalCreditsRequired} credits</span>. Your balance of <span className="text-red-400 font-black">{credits}</span> is insufficient.
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => window.location.href='/dashboard/pricing'} className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black tracking-widest text-xs uppercase transition-colors shadow-lg shadow-blue-500/20">Recharge Credits</button>
                    <button onClick={() => setIsInsufficient(false)} className="py-3 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest text-center">Maybe Later</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
