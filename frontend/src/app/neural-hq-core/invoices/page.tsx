'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/constants';

const Icons = {
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/admin/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stream');
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/[0.03] rounded-2xl border border-white/[0.05]"></div>)}
  </div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02] border border-white/[0.05] p-8 rounded-[2.5rem]">
         <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">Global Document Stream</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">System-Wide Extraction Log</p>
         </div>
      </div>

      <div className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl overflow-x-auto custom-scrollbar">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-white/[0.03]">
                  {['Neural Object', 'Owner Identity', 'Fiscal Value', 'Processed', 'Ops'].map(h => (
                     <th key={h} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 border-b border-[var(--border)]">{h}</th>
                  ))}
               </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
               {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-purple-600/[0.02] transition-colors group">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-purple-600/5 border border-purple-500/10 flex items-center justify-center text-purple-500">
                              <Icons.File />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs font-black uppercase tracking-tight">{inv.fileName}</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest opacity-30 italic">{inv.moduleType}</span>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-xs font-black uppercase tracking-tight">{inv.user?.email}</span>
                           <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Operator ID: {inv.userId.slice(-6).toUpperCase()}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-sm font-black tracking-tighter">₹{inv.totalAmount?.toLocaleString()}</span>
                           <span className="text-[8px] font-bold uppercase tracking-widest text-purple-500">Confidence: {Math.round((inv.confidence || 0) * 100)}%</span>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-tight opacity-40">
                        {new Date(inv.processedAt).toLocaleDateString()}
                     </td>
                     <td className="px-8 py-6">
                        {(() => {
                           const absoluteUrl = inv.fileUrl?.startsWith('http') 
                             ? inv.fileUrl 
                             : `${API_URL.replace('/api', '')}/${inv.fileUrl}`;
                           return (
                             <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setSelectedInvoice({ ...inv, absoluteUrl })}
                                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-gray-500 hover:text-white"
                                  title="Audit Details"
                                >
                                   <Icons.Eye />
                                </button>
                                <button 
                                  onClick={() => window.open(absoluteUrl, '_blank')}
                                  className="p-3 bg-purple-600/5 border border-purple-500/20 rounded-xl hover:bg-purple-600/10 transition-all text-purple-500"
                                  title="Download Original"
                                >
                                   <Icons.Download />
                                </button>
                             </div>
                           );
                        })()}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* Audit Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-white/[0.08] w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-10 py-8 border-b border-white/[0.05]">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
                    <Icons.File />
                 </div>
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">{selectedInvoice.fileName}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">Internal Audit Stream</p>
                 </div>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <Icons.X />
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Document Preview */}
              <div className="w-full lg:w-1/2 p-10 bg-black/40 border-r border-white/[0.05] flex flex-col items-center justify-center overflow-hidden">
                 <iframe 
                   src={selectedInvoice.absoluteUrl} 
                   className="w-full h-full rounded-2xl border border-white/10 bg-white/5"
                   title="Document Preview"
                 />
              </div>

              {/* Data Audit */}
              <div className="w-full lg:w-1/2 overflow-y-auto p-10 custom-scrollbar space-y-12">
                 <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500 mb-8">Neural Extraction Results</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <div className={`p-6 rounded-2xl border transition-all ${selectedInvoice.vendorName ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-red-500/5 border-red-500/20'}`}>
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Vendor</p>
                          <p className={`text-sm font-black uppercase tracking-tight ${!selectedInvoice.vendorName && 'text-red-500/50 italic'}`}>{selectedInvoice.vendorName || 'Not Detected'}</p>
                       </div>
                       <div className={`p-6 rounded-2xl border transition-all ${selectedInvoice.invoiceNumber ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-red-500/5 border-red-500/20'}`}>
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Invoice #</p>
                          <p className={`text-sm font-black uppercase tracking-tight ${!selectedInvoice.invoiceNumber && 'text-red-500/50 italic'}`}>{selectedInvoice.invoiceNumber || 'Not Detected'}</p>
                       </div>
                       <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">GSTIN</p>
                          <p className="text-sm font-black uppercase tracking-tight text-blue-500">{selectedInvoice.gstin || 'No GSTIN'}</p>
                       </div>
                       <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Total Amount</p>
                          <p className="text-sm font-black uppercase tracking-tight text-green-500">₹{selectedInvoice.totalAmount?.toLocaleString()}</p>
                       </div>
                    </div>
                 </section>

                 <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500 mb-8">Line Items</h3>
                    <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.01]">
                       <table className="w-full text-left">
                          <thead className="bg-white/[0.05]">
                             <tr>
                                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-white/50">Description</th>
                                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-white/50">Qty</th>
                                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-white/50 text-right">Price</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.05]">
                             {selectedInvoice.items && selectedInvoice.items.length > 0 ? selectedInvoice.items.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                   <td className="px-6 py-5 text-sm font-black text-white uppercase tracking-tight">{item.description}</td>
                                   <td className="px-6 py-5 text-sm font-black text-white">{item.quantity}</td>
                                   <td className="px-6 py-5 text-sm font-black text-white text-right">₹{item.price?.toLocaleString()}</td>
                                </tr>
                             )) : (
                                <tr>
                                   <td colSpan={3} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-white/20">No items detected in neural stream</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </section>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
