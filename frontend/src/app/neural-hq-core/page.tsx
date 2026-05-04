'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/constants';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/admin/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/[0.03] rounded-3xl border border-white/[0.05]"></div>)}
    </div>
    <div className="h-96 bg-white/[0.03] rounded-[3rem] border border-white/[0.05]"></div>
  </div>;

  const accounting = metrics?.accounting || {};

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Users', value: metrics.totalUsers, accent: 'blue' },
          { label: 'Gross Revenue', value: `₹${accounting.grossRevenue}`, accent: 'green' },
          { label: 'Net Profit', value: `₹${accounting.netProfit}`, accent: 'purple' },
          { label: 'Invoices Processed', value: metrics.totalInvoicesProcessed, accent: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="rounded-[2.5rem] p-10 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-sm">
             <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.accent}-600/5 blur-3xl group-hover:bg-${stat.accent}-600/10 transition-colors`}></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-6">{stat.label}</p>
             <h2 className="text-4xl font-black tracking-tighter leading-none">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         <div className="xl:col-span-8 rounded-[3rem] p-12 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500 mb-2">Accounting Engine</p>
                  <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">Fiscal Intelligence</h3>
               </div>
               <div className="px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-500 tracking-widest uppercase">Live Audit</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <div className="flex items-center justify-between py-4 border-b border-white/[0.03]">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-40">Tax Reserve (20%)</span>
                      <span className="text-lg font-black tracking-tighter text-red-500/80">₹{accounting.taxReserved}</span>
                   </div>
                   <div className="flex items-center justify-between py-4 border-b border-white/[0.03]">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-40">Gateway Fees (2.9%)</span>
                      <span className="text-lg font-black tracking-tighter text-orange-500/80">₹{accounting.gatewayFees}</span>
                   </div>
                   <div className="flex items-center justify-between py-4 border-b border-white/[0.03]">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-40">AI Extraction Cost</span>
                      <span className="text-lg font-black tracking-tighter text-blue-500/80">₹{accounting.aiComputeCosts}</span>
                   </div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem]">
                    <div className="w-16 h-1 bg-purple-500 mb-6 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-4">Estimated Net Profit</p>
                    <h2 className="text-6xl font-black tracking-tighter text-white">₹{accounting.netProfit}</h2>
                </div>
            </div>
         </div>

         <div className="xl:col-span-4 rounded-[3rem] p-12 border border-[var(--border)] bg-[var(--card)] shadow-sm">
             <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-10">Active Plans</div>
             <div className="space-y-6">
                {(metrics.plans || []).map((plan: any) => (
                  <div key={plan.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.04] transition-all">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">{plan.name}</p>
                        <p className="text-lg font-black tracking-tighter italic">₹{plan.price}</p>
                     </div>
                  </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  );
}
