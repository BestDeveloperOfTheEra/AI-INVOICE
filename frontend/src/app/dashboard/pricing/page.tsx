'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { useRazorpay } from '@/hooks/useRazorpay';
import { API_URL } from '@/lib/constants';

// --- Premium Inline SVGs for Pricing ---
const Icons = {
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Sparkle: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  )
};

export default function PricingPage() {
  const { planName, credits, refreshUserData } = useDashboard();
  const { openRazorpayCheckout } = useRazorpay();
  const [plans, setPlans] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/subscriptions/plans`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching plans:', err));
  }, []);

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Elite Section Header */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-[2px] bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,1)]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] opacity-40" style={{ color: 'var(--foreground)' }}>Financial Scaling</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic" style={{ color: 'var(--foreground)' }}>Neural Quota <span className="text-blue-600">Upgrade</span></h2>
            <p className="text-xs font-bold uppercase tracking-widest max-w-xl opacity-50" style={{ color: 'var(--foreground)' }}>
                Scale your extraction intelligence with ultra-low latency processing and high-priority neural batches.
            </p>
        </div>

        {/* Global Billing Controller */}
        <div className="flex items-center justify-between p-1 border border-[var(--border)] rounded-2xl w-fit" style={{ backgroundColor: 'var(--card)' }}>
            <button 
                onClick={() => setBillingCycle('month')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'month' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'opacity-40 hover:opacity-100'}`}
                style={{ color: billingCycle === 'month' ? '' : 'var(--foreground)' }}
            >
                Monthly Pulse
            </button>
            <button 
                onClick={() => setBillingCycle('year')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'year' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'opacity-40 hover:opacity-100'}`}
                style={{ color: billingCycle === 'year' ? '' : 'var(--foreground)' }}
            >
                Annual Stream <span className="ml-2 text-green-400 opacity-60 italic">-20% Economy</span>
            </button>
        </div>

        {/* Neural Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 pb-20">
            {plans
                .filter(p => p.billingCycle === billingCycle || p.name === 'Enterprise')
                .sort((a, b) => a.name === 'Enterprise' ? 1 : b.name === 'Enterprise' ? -1 : a.price - b.price)
                .map((plan) => {
                    const isCurrent = plan.name === planName;
                    const isEnterprise = plan.name === 'Enterprise';

                    return (
                        <div 
                            key={plan.id} 
                            className={`group relative flex flex-col p-8 rounded-[2rem] transition-all duration-500 overflow-hidden shadow-xl ${
                                isCurrent 
                                ? 'bg-blue-600/5 border border-blue-500/30' 
                                : 'bg-white/[0.02] border border-[var(--border)] hover:border-blue-500/30 hover:-translate-y-2'
                            }`}
                            style={{ backgroundColor: isCurrent ? '' : 'var(--card)' }}
                        >
                            {/* Industrial Accents */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] pointer-events-none group-hover:bg-blue-600/10 transition-all duration-700"></div>
                            
                            {isCurrent && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest italic shadow-lg z-10">
                                    Active Node
                                </div>
                            )}

                            {/* Plan Identity */}
                            <div className="mb-10 relative z-10">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2 italic">
                                    <Icons.Sparkle /> {plan.name} Intelligence
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black tracking-tighter" style={{ color: 'var(--foreground)' }}>
                                        {isEnterprise ? 'Elite' : `₹${plan.price}`}
                                    </span>
                                    {!isEnterprise && <span className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--foreground)' }}>/ {(plan.billingCycle || 'mo').slice(0,2)}</span>}
                                </div>
                            </div>

                            {/* Plan Capabilities */}
                            <div className="flex-1 flex flex-col gap-5 mb-10 relative z-10">
                                <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                                     <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1 italic">Neural Capacity</p>
                                     <p className="text-sm font-black text-white">{isEnterprise ? 'Infinite' : plan.quotaPages.toLocaleString()} Pages / Cycle</p>
                                </div>

                                <ul className="space-y-4">
                                    {[
                                        'Full AI Neural Extraction',
                                        'Industrial-Grade OCR',
                                        plan.name !== 'Free' ? 'Bulk Batch Streams' : null,
                                        isEnterprise ? '24/7 Dedicated Pulse' : 'Standard Response',
                                        'Global GST Verification'
                                    ].filter(Boolean).map((feat, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                            <span className="text-blue-500 opacity-60"><Icons.Check /></span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Industrial CTA */}
                            <button 
                                onClick={() => {
                                    if (isCurrent || isProcessingUpgrade) return;
                                    if (isEnterprise) { window.location.href='mailto:sales@autoextract.in'; return; }
                                    setIsProcessingUpgrade(plan.id);
                                    const token = localStorage.getItem('access_token');
                                    fetch(`${API_URL}/subscriptions/checkout`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ planId: plan.id })
                                    })
                                    .then(res => res.ok ? res.json() : res.json().then(e => { throw e }))
                                    .then(data => openRazorpayCheckout(data))
                                    .catch(err => alert(`System Override: ${err.message}`))
                                    .finally(() => setIsProcessingUpgrade(null));
                                }}
                                disabled={isCurrent || isProcessingUpgrade !== null}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 relative z-10 ${
                                    isCurrent 
                                    ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white' 
                                    : 'bg-white/[0.02] border border-white/[0.05] text-gray-500 hover:bg-blue-600 hover:text-white hover:border-transparent hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]'
                                }`}
                            >
                                {isCurrent ? 'Current Intelligence' : isProcessingUpgrade === plan.id ? 'Loading...' : isEnterprise ? 'Request Audit' : 'Upgrade Stream'}
                            </button>
                        </div>
                    );
                })}
        </div>
    </div>
  );
}
