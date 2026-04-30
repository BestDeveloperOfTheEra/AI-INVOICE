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
  ),
  Edit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
  ),
  Eye: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  FileText: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
  )
};

export default function HistoryPage() {
  const router = useRouter();
  const { isLoading: isDashboardLoading } = useDashboard();
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [datePeriod, setDatePeriod] = useState('all');
  
  // Edit Modal States
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [editableData, setEditableData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);



  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setIsLoading(true);
    const res = await fetch(`${API_URL}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (Array.isArray(data)) {
        const history = data.map(doc => {
            try {
                const parsed = JSON.parse(doc.extractedData);
                return { ...parsed, id: doc.id, fileName: doc.fileName, status: doc.status, processedAt: doc.processedAt };
            } catch (e) { return null; }
        }).filter(Boolean);
        setExtractedData(history);
    }
    setIsLoading(false);
  };

  const downloadOriginal = async (id: string, fileName: string) => {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_URL}/documents/download/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Download response error:", errorText);
            throw new Error(`Server returned ${res.status}: ${errorText}`);
        }

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const { url } = await res.json();
            window.open(url, '_blank');
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'document.pdf';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: any) { 
        console.error("Download process failed:", err);
        alert(`Download failed: ${err.message || 'Check connection'}`); 
    }
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_URL}/documents/export/${type}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_Report_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: any) {
        alert(`Export failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to mark this document as deleted?")) return;
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_URL}/documents/${id}?t=${Date.now()}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            await fetchHistory();
        } else {
            const err = await res.json();
            alert(`Error: ${err.message || 'Could not delete'}`);
        }
    } catch (err) {
        console.error(err);
        alert("Network error occurred while deleting.");
    }
  };

  const handleEdit = (doc: any) => {
    setEditingDoc(doc);
    setEditableData(doc);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    if (!editableData) return;
    const newItems = [...(editableData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditableData({ ...editableData, items: newItems });
  };

  const handleAddItem = () => {
    if (!editableData) return;
    const newItems = [...(editableData.items || []), { name: 'New Item', quantity: 1, amount: 0 }];
    setEditableData({ ...editableData, items: newItems });
  };

  const handleSave = async () => {
    if (!editingDoc || !editableData) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/documents/${editingDoc.id}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editableData)
      });
      if (res.ok) {
        setEditingDoc(null);
        setEditableData(null);
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (editableData && (editableData.items || editableData.taxBreakdown)) {
      const itemsTotal = (editableData.items || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
      const taxTotal = (editableData.taxBreakdown?.cgst || 0) + 
                       (editableData.taxBreakdown?.sgst || 0) + 
                       (editableData.taxBreakdown?.igst || 0);
      const newTotal = itemsTotal + taxTotal;
      if (Math.abs(newTotal - (editableData.totalAmount || 0)) > 0.01) {
        setEditableData({ ...editableData, totalAmount: newTotal });
      }
    }
  }, [editableData?.items, editableData?.taxBreakdown]);

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
                        className="flex-1 bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest placeholder:text-gray-500"
                        style={{ color: 'var(--foreground)' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex gap-4 p-4 border border-[var(--border)] rounded-[2.5rem]" style={{ backgroundColor: 'var(--card)' }}>
                 <button onClick={() => handleExport('excel')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg">Export Excel</button>
                 <button onClick={() => handleExport('pdf')} className="flex-1 bg-white/[0.02] border border-[var(--border)] text-gray-600 dark:text-gray-400 hover:text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">Export PDF</button>
            </div>
        </div>

        {/* Data Stream */}
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-[2.5rem] overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                         <tr className="bg-white/[0.01]">
                             {['Signature Date', 'Neural Identity', 'Global Signature', 'Amount', 'Tax', 'Total', 'Action'].map(h => (
                                 <th key={h} className="px-6 py-6 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.5em] border-b border-white/[0.03] whitespace-nowrap">{h}</th>
                             ))}
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.015]">
                         {filteredData.length === 0 ? (
                           <tr>
                               <td colSpan={7} className="px-6 py-32 text-center">
                                   <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest italic opacity-40">No Neural Records Found</p>
                               </td>
                           </tr>
                         ) : filteredData.map((data, i) => (
                           <tr key={i} className={`hover:bg-white/[0.01] transition-all group ${data.status === 'deleted' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                             <td className={`px-6 py-6 text-[11px] font-black uppercase italic opacity-60 ${data.status === 'deleted' ? 'line-through' : ''}`} style={{ color: 'var(--foreground)' }}>{data.date}</td>
                             <td className="px-6 py-6">
                                 <div className="flex flex-col">
                                     <div className="flex items-center gap-2">
                                         <span className={`text-[13px] font-black uppercase tracking-tight group-hover:text-blue-500 transition-colors ${data.status === 'deleted' ? 'line-through' : ''}`} style={{ color: 'var(--foreground)' }}>{data.vendor}</span>
                                         {data.status === 'deleted' && (
                                             <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[7px] font-black uppercase tracking-[0.2em] text-red-500">Deleted</span>
                                         )}
                                     </div>
                                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--foreground)' }}>To: {data.customerName || 'N/A'}</span>
                                 </div>
                             </td>
                             <td className="px-6 py-6 text-[11px] font-mono text-blue-500 uppercase tracking-tighter truncate max-w-[150px]">{data.invoiceNumber || 'SIG_PENDING'}</td>
                             <td className="px-6 py-6 text-[12px] font-bold" style={{ color: 'var(--foreground)' }}>₹{(data.totalAmount - ((data.taxBreakdown?.cgst || 0) + (data.taxBreakdown?.sgst || 0) + (data.taxBreakdown?.igst || 0))).toLocaleString()}</td>
                             <td className="px-6 py-6 text-[12px] font-bold text-red-500/60" style={{ color: '' }}>₹{((data.taxBreakdown?.cgst || 0) + (data.taxBreakdown?.sgst || 0) + (data.taxBreakdown?.igst || 0)).toLocaleString()}</td>
                             <td className="px-6 py-6 text-[13px] font-black italic" style={{ color: 'var(--foreground)' }}>₹{(data.totalAmount || 0).toLocaleString()}</td>
                             <td className="px-6 py-6">
                                 <div className="flex items-center gap-4">
                                     {data.status !== 'deleted' && (
                                         <>
                                             <button 
                                                 onClick={() => handleEdit(data)}
                                                 className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all hover:scale-110"
                                                 title="View & Edit Details"
                                             >
                                                 <Icons.Eye />
                                             </button>
                                             <button 
                                                 onClick={() => downloadOriginal(data.id, data.fileName)}
                                                 className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all hover:scale-110"
                                                 title="Download Original"
                                             >
                                                 <Icons.Download />
                                             </button>
                                             <button 
                                                 onClick={() => handleDelete(data.id)}
                                                 className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-500/30 transition-all hover:scale-110"
                                                 title="Mark Deleted"
                                             >
                                                 <Icons.Trash />
                                             </button>
                                         </>
                                     )}
                                 </div>
                             </td>
                           </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>

        {/* EDIT MODAL - PORTED FROM DASHBOARD */}
        {editingDoc && (
           <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-md animate-in fade-in duration-700">
               <div className="bg-[#ffffff] dark:bg-[#080808] border border-[var(--border)] rounded-[3rem] max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 relative overflow-hidden group/modal" style={{ color: 'var(--foreground)' }}>
                   
                   <div className="absolute top-0 right-0 p-10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all duration-300 z-50 text-2xl" onClick={() => setEditingDoc(null)}>✕</div>
                   
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10 mb-8 px-12 pt-12">
                       <div className="flex items-center gap-8">
                           <div className="relative">
                               <div className="absolute inset-0 bg-blue-500/10 blur-2xl"></div>
                               <div className="relative w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl">
                                   <Icons.Sparkles />
                               </div>
                           </div>
                           <div>
                               <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.4em] mb-1">Archive Record Data</p>
                               <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Neural Insights</h3>
                           </div>
                       </div>
                       <div className="flex flex-col items-end gap-3">
                           <button 
                               onClick={() => downloadOriginal(editingDoc.id, editingDoc.fileName)}
                               className="flex items-center gap-3 px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 hover:bg-blue-600/20 transition-all"
                           >
                               <Icons.FileText />
                               <span className="text-[10px] font-black uppercase tracking-widest">View Original File</span>
                           </button>
                       </div>
                   </div>

                   <div className="flex-1 overflow-y-auto px-12 py-4 custom-scrollbar">
                       <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
                           <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                               <div className="rounded-[2.5rem] p-10 border border-[var(--border)] shadow-sm hover:bg-white/[0.02] transition-all duration-700" style={{ backgroundColor: 'var(--card)' }}>
                                   <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-8">Entity Profile</p>
                                   <input 
                                       value={editableData?.vendor || ''} 
                                       onChange={(e) => setEditableData({...editableData, vendor: e.target.value})}
                                       className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight mb-6 bg-transparent border-b border-transparent hover:border-blue-500/30 focus:border-blue-500 focus:outline-none w-full"
                                   />
                               </div>

                               <div className="rounded-[2.5rem] p-10 border border-[var(--border)] transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
                                   <div className="flex items-center justify-between mb-8">
                                       <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Neural Item Log</div>
                                       <button onClick={handleAddItem} className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-600/20 transition-all">+ Add Item</button>
                                   </div>
                                   <div className="space-y-4">
                                       {(editableData?.items || []).map((item: any, idx: number) => (
                                           <div key={idx} className="flex items-center justify-between p-5 rounded-2xl border border-[var(--border)] group/item transition-all hover:bg-white/[0.03]">
                                               <div className="flex items-center gap-6 flex-1">
                                                   <div className="w-10 h-10 rounded-xl bg-blue-600/5 flex items-center justify-center text-[10px] font-black text-blue-500">0{idx+1}</div>
                                                   <div className="flex flex-col gap-1 flex-1">
                                                       <input value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest w-full" />
                                                       <div className="flex items-center gap-2">
                                                           <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">Qty:</span>
                                                           <input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value))} className="bg-transparent border-none outline-none text-[10px] font-black text-blue-500 w-10" />
                                                       </div>
                                                   </div>
                                               </div>
                                               <div className="flex items-center gap-4">
                                                   <div className="flex items-center gap-2 text-xs font-black tracking-widest">
                                                       <span>₹</span>
                                                       <input type="number" value={item.amount} onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value))} className="bg-transparent border-none outline-none text-right w-24" />
                                                   </div>
                                                   <button onClick={() => {
                                                       const newItems = [...editableData.items];
                                                       newItems.splice(idx, 1);
                                                       setEditableData({ ...editableData, items: newItems });
                                                   }} className="text-red-500/40 hover:text-red-500 transition-colors">✕</button>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>

                           <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-8">
                               <div className="rounded-[3rem] p-12 border border-[var(--border)] h-full flex flex-col justify-between shadow-sm transition-all duration-500" style={{ backgroundColor: 'var(--card)' }}>
                                   <div>
                                       <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] mb-10 opacity-60">Verified Payable</p>
                                       <div className="flex items-center gap-3">
                                           <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">₹</h2>
                                           <input type="number" value={editableData?.totalAmount || 0} readOnly className="text-3xl md:text-5xl font-black tracking-tighter leading-none bg-transparent border-none outline-none w-full" />
                                       </div>
                                   </div>
                                   <div className="pt-10 border-t border-[var(--border)] space-y-8">
                                       <div className="space-y-6">
                                           <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Tax Breakdown</p>
                                           <div className="grid grid-cols-3 gap-4">
                                               {['cgst', 'sgst', 'igst'].map(tax => (
                                                   <div key={tax} className="space-y-2">
                                                       <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{tax.toUpperCase()}</p>
                                                       <input type="number" value={editableData?.taxBreakdown?.[tax] || 0} onChange={(e) => setEditableData({...editableData, taxBreakdown: { ...editableData.taxBreakdown, [tax]: parseFloat(e.target.value) }})} className="text-lg font-black tracking-tighter bg-transparent border-b border-transparent hover:border-blue-500/30 focus:border-blue-500 focus:outline-none w-full" />
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                       <div className="grid grid-cols-2 gap-8 border-t border-[var(--border)] pt-8">
                                           <div className="space-y-1">
                                               <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Tax Net</p>
                                               <p className="text-xl font-black tracking-tighter text-blue-500">₹{((editableData?.taxBreakdown?.cgst || 0) + (editableData?.taxBreakdown?.sgst || 0) + (editableData?.taxBreakdown?.igst || 0)).toLocaleString()}</p>
                                           </div>
                                           <div className="space-y-1">
                                               <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Log Date</p>
                                               <p className="text-xl font-black tracking-tighter">{new Date(editingDoc.processedAt).toLocaleDateString('en-GB')}</p>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>

                   <div className="relative z-10 flex gap-6 px-12 pb-12 pt-6 border-t border-[var(--border)] bg-inherit">
                       <button onClick={handleSave} disabled={isSaving} className="flex-1 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-sm tracking-[0.4em] uppercase transition-all shadow-xl disabled:opacity-50">{isSaving ? 'Synchronizing...' : 'Confirm Update'}</button>
                       <button onClick={() => setEditingDoc(null)} className="px-12 py-6 bg-white/[0.02] border border-white/[0.08] text-white rounded-[2rem] font-black text-xs tracking-widest uppercase hover:bg-white/[0.05] transition-all">Cancel</button>
                   </div>
               </div>
           </div>
        )}
    </div>
  );
}
