'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { API_URL } from '@/lib/constants';

export default function HistoryPage() {
  const router = useRouter();
  const { isLoading: isDashboardLoading } = useDashboard();
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [datePeriod, setDatePeriod] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_URL}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to fetch document history');
        return res.json();
    })
    .then(data => {
        if (Array.isArray(data)) {
            const history = data.map(doc => {
                try {
                    const parsed = JSON.parse(doc.extractedData);
                    return {
                        ...parsed,
                        id: doc.id, // Store the document ID for download
                        fileName: doc.fileName,
                        // Fallback: If taxAmount is missing, try calculating from taxBreakdown
                        taxAmount: parsed.taxAmount ?? (
                            parsed.taxBreakdown ? (
                                (parsed.taxBreakdown.cgst || 0) + 
                                (parsed.taxBreakdown.sgst || 0) + 
                                (parsed.taxBreakdown.igst || 0)
                            ).toFixed(2) : '0.00'
                        )
                    };
                } catch (e) {
                    console.error("Failed to parse doc.extractedData", doc.extractedData);
                    return null;
                }
            }).filter(Boolean);
            setExtractedData(history);
        }
    })
    .catch(err => {
        console.error("History fetch error:", err);
        setExtractedData([]);
    })
    .finally(() => setIsLoading(false));
  }, []);

  const exportToExcel = async () => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_URL}/documents/export/excel`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        alert("Failed to export Excel report.");
        return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Report_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToPdf = async () => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_URL}/documents/export/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        alert("Failed to export PDF report.");
        return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Report_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToTally = async () => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_URL}/documents/export/tally`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        alert("Failed to export Tally XML.");
        return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tally_Import_${Date.now()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
        alert("Failed to download original file. It may no longer be available on the server.");
    }
  };

  const filteredData = extractedData.filter(doc => {
     const matchSearch = searchTerm === '' 
       || doc.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
       || doc.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
       || doc.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
     
     if (!matchSearch) return false;
     if (datePeriod === 'all') return true;

     const docDate = new Date(doc.date);
     if (isNaN(docDate.getTime())) return true;
     
     const now = new Date();
     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
     const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
     
     if (datePeriod === 'today') return docDate >= today;
     if (datePeriod === 'yesterday') return docDate >= yesterday && docDate < today;
     if (datePeriod === 'weekly') {
         const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
         return docDate >= lastWeek;
     }
     if (datePeriod === 'monthly') {
         const lastMonth = new Date(today); lastMonth.setMonth(lastMonth.getMonth() - 1);
         return docDate >= lastMonth;
     }
     if (datePeriod === 'custom') {
         if (!customStart && !customEnd) return true;
         let valid = true;
         if (customStart) valid = valid && (docDate >= new Date(customStart));
         if (customEnd) {
             const endObj = new Date(customEnd);
             endObj.setHours(23, 59, 59, 999);
             valid = valid && (docDate <= endObj);
         }
         return valid;
     }
     return true;
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
        <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium tracking-widest text-[10px] uppercase">Retrieving History...</p>
    </div>
  );

  return (
    <div id="extraction-results" className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
                <span className="text-gray-500 ml-2">🔍</span>
                <input 
                    type="text" 
                    placeholder="Search by vendor or invoice #..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
                <select 
                    value={datePeriod} 
                    onChange={e => setDatePeriod(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none hover:bg-white/10 transition-colors"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="weekly">Last 7 Days</option>
                    <option value="monthly">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                </select>
                {datePeriod === 'custom' && (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none" />
                        <span className="text-gray-600 text-[10px]">to</span>
                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none" />
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 mr-2"
                >
                    <span>+</span> Upload More
                </button>
                <button onClick={exportToExcel} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-green-400" title="Export to Excel">
                    📊
                </button>
                <button onClick={exportToPdf} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-red-400" title="Export to PDF">
                    📕
                </button>
                <button onClick={exportToTally} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-blue-400" title="Export for Tally">
                    📑
                </button>
            </div>
        </div>

        {/* Dynamic Table */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b border-white/10">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Vendor & Customer</th>
                  <th className="px-6 py-4">Contact & Address</th>
                  <th className="px-6 py-4">Tax (₹)</th>
                  <th className="px-6 py-4 text-right">Total (₹)</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic text-sm">No extractions found matches your search.</td>
                  </tr>
                ) : filteredData.map((data, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors group cursor-default">
                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">{data.date}</td>
                    <td className="px-6 py-4 text-xs font-mono text-blue-400/70">{data.invoiceNumber || 'N/A'}</td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{data.vendor}</span>
                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">To: {data.customerName || 'N/A'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400 truncate max-w-[150px]" title={data.address}>{data.address || 'No Address'}</span>
                            <span className="text-[9px] text-blue-400/60 font-mono">{data.email || data.phone || 'No Contact Info'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">₹{data.taxAmount || '0.00'}</td>
                    <td className="px-6 py-4 text-sm font-black text-right text-white">₹{data.totalAmount}</td>
                    <td className="px-6 py-4 text-center">
                        <button 
                            onClick={() => downloadOriginal(data.id, data.fileName)}
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-blue-400 group-hover:scale-110 transition-transform"
                            title="Download Original PDF"
                        >
                            ⬇️
                        </button>
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
