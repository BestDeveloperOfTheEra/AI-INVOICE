'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { API_URL } from '@/lib/constants';

// --- Premium Inline SVGs for History ---
const Icons = {
  Scan: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/><path d="M12 7v10"/></svg>
  ),
  Download: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  Trash: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  )
};

export default function HistoryPage() {
  const router = useRouter();
  const { isLoading: isDashboardLoading } = useDashboard();
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [datePeriod, setDatePeriod] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_URL}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => {
        if (Array.isArray(data)) {
            const history = data.map(doc => {
                try {
                    const parsed = JSON.parse(doc.extractedData);
                    return { ...parsed, id: doc.id, fileName: doc.fileName };
                } catch (e) { return null; }
            }).filter(Boolean);
            setExtractedData(history);
        }
    })
    .finally(() => setIsLoading(false));
  }, []);

  const downloadOriginal = async (id: string, fileName: string) => {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_URL}/documents/download/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("File not found");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'document.pdf';
        a.click();
    } catch (err) { alert("Download failed"); }
  };

  const filteredData = extractedData.filter(doc => {
     const match = searchTerm === '' || doc.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
     return match;
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-700">
        <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mt-6">Indexing Archive...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Elite Section Header */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-[2px] bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,1)]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] opacity-40" style={{ color: 'var(--foreground)' }}>Audit Analytics</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic" style={{ color: 'var(--foreground)' }}>Neural <span className="text-blue-600">Archive</span></h2>
            <p className="text-xs font-bold uppercase tracking-widest max-w-xl opacity-50" style={{ color: 'var(--foreground)' }}>
                Cryptographically tracked extraction history. Index, filter, and export your global financial signatures in real-time.
            </p>
        </div>

        {/* Action Infrastructure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 flex items-center gap-4 border border-[var(--border)] p-6 rounded-[2rem] transition-colors" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex-1 flex items-center gap-4 border border-[var(--border)] rounded-2xl px-6 py-4" style={{ backgroundColor: 'var(--background)' }}>
                    <span className="text-gray-600 pr-2 border-r border-[var(--border)] opacity-40 italic">ID_SEARCH</span>
                    <input 
                        type="text" 
                        placeholder="SEARCH NEURAL SIGNATURE..." 
                        className="flex-1 bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest placeholder:text-gray-700"
                        style={{ color: 'var(--foreground)' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex gap-4 p-4 border border-[var(--border)] rounded-[2rem]" style={{ backgroundColor: 'var(--card)' }}>
                 <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg">Export Excel</button>
                 <button className="flex-1 bg-white/[0.02] border border-[var(--border)] text-gray-500 hover:text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">Export PDF</button>
            </div>
        </div>

        {/* Data Stream */}
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-[2.5rem] overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-separate border-spacing-0">
                     <thead>
                         <tr className="bg-white/[0.01]">
                             {['Signature Date', 'Neural Identity', 'Global Signature', 'Liquid Value', 'Action'].map(h => (
                                 <th key={h} className="px-12 py-8 text-[9px] font-black text-gray-600 uppercase tracking-[0.5em] border-b border-white/[0.03] whitespace-nowrap">{h}</th>
                             ))}
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.015]">
                         {filteredData.length === 0 ? (
                           <tr>
                               <td colSpan={5} className="px-12 py-32 text-center">
                                   <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic opacity-40">No Neural Records Found</p>
                               </td>
                           </tr>
                         ) : filteredData.map((data, i) => (
                           <tr key={i} className="hover:bg-white/[0.01] transition-all group">
                             <td className="px-12 py-8 text-[11px] font-black uppercase italic opacity-60" style={{ color: 'var(--foreground)' }}>{data.date}</td>
                             <td className="px-12 py-8">
                                 <div className="flex flex-col">
                                     <span className="text-[13px] font-black uppercase tracking-tight group-hover:text-blue-500 transition-colors" style={{ color: 'var(--foreground)' }}>{data.vendor}</span>
                                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--foreground)' }}>To: {data.customerName || 'N/A'}</span>
                                 </div>
                             </td>
                             <td className="px-12 py-8 text-[11px] font-mono text-blue-500 uppercase tracking-tighter truncate max-w-[150px]">{data.invoiceNumber || 'SIG_PENDING'}</td>
                             <td className="px-12 py-8 text-[13px] font-black italic" style={{ color: 'var(--foreground)' }}>₹{data.totalAmount}</td>
                             <td className="px-12 py-8">
                                 <div className="flex items-center gap-4">
                                     <button 
                                        onClick={() => downloadOriginal(data.id, data.fileName)}
                                        className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-500 hover:text-blue-500 hover:border-blue-500/30 transition-all hover:scale-110"
                                     >
                                         <Icons.Download />
                                     </button>
                                 </div>
                             </td>
                           </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    </div>
  );
}
