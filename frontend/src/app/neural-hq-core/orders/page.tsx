'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/constants';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch ledger');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/[0.03] rounded-2xl border border-white/[0.05]"></div>)}
  </div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02] border border-white/[0.05] p-8 rounded-[2.5rem]">
         <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">Financial Ledger</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Revenue Stream Record</p>
         </div>
      </div>

      <div className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl overflow-x-auto custom-scrollbar">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-white/[0.03]">
                  {['Transaction ID', 'Customer Entity', 'Value', 'Status', 'Timestamp'].map(h => (
                     <th key={h} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 border-b border-[var(--border)]">{h}</th>
                  ))}
               </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
               {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-purple-600/[0.02] transition-colors group">
                     <td className="px-8 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 font-mono">{o.transactionId || 'INTERNAL'}</span>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-xs font-black uppercase tracking-tight">{o.user?.email}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className="text-sm font-black tracking-tighter text-green-500">₹{o.amount.toLocaleString()}</span>
                     </td>
                     <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${o.status === 'paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                           {o.status}
                        </div>
                     </td>
                     <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-tight opacity-40">
                        {new Date(o.createdAt).toLocaleDateString()}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
