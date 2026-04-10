'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { useRazorpay } from '@/hooks/useRazorpay';
import { API_URL } from '@/lib/constants';

export default function PricingPage() {
  const { planName, credits, refreshUserData } = useDashboard();
  const { openRazorpayCheckout } = useRazorpay();
  const [plans, setPlans] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');

  useEffect(() => {
    fetch(`${API_URL}/subscriptions/plans`)
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-in zoom-in-95 duration-500">
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-4">
            <span className={`text-sm font-medium ${billingCycle === 'month' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button 
                onClick={() => setBillingCycle(billingCycle === 'month' ? 'year' : 'month')}
                className="w-14 h-7 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
            >
                <div className={`w-5 h-5 bg-blue-500 rounded-full shadow-lg transition-transform duration-300 ${billingCycle === 'year' ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'year' ? 'text-white' : 'text-gray-500'}`}>
                Annually <span className="text-green-400 text-[10px] bg-green-400/10 px-2 py-0.5 rounded-full ml-1 font-bold">SAVE 20%</span>
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
        {plans.filter(p => p.name === 'Free' || p.billingCycle === billingCycle).map((plan) => {
            const currentPlan = plans.find(p => p.name === planName);
            const currentPrice = currentPlan?.price || 0;
            const isCurrent = plan.name === planName;
            const isUpgrade = plan.price > currentPrice;

            return (
                <div key={plan.id} className={`relative group p-8 rounded-3xl bg-white/[0.03] border transition-all hover:scale-[1.02] flex flex-col items-center text-center ${isCurrent ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-white/10 hover:bg-white/[0.05]'}`}>
                    {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest z-20">Active</div>}
                    {!isCurrent && plan.name === 'Pro' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30 z-20">Most Popular</div>}
                    {!isCurrent && plan.name === 'Max' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/30 z-20">Enterprise Ready</div>}
                    <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                    <div className="text-4xl font-black text-white mb-4">
                        ₹{plan.price}<span className="text-sm font-medium text-gray-500">/{plan.billingCycle === 'year' ? 'yr' : 'mo'}</span>
                    </div>
                    <ul className="text-gray-400 text-sm space-y-3 mb-8 text-left w-full flex-1">
                        <li className="flex items-center gap-2">✅ {plan.quotaPages.toLocaleString()} Invoices {plan.billingCycle === 'year' ? '/ yr' : '/ mo'}</li>
                        {plan.name !== 'Free' && <li className="flex items-center gap-2 text-blue-300 font-medium">✅ Bulk Upload Included</li>}
                        <li className="flex items-center gap-2">✅ AI Extraction API</li>
                        <li className="flex items-center gap-2">✅ GST-Ready Export</li>
                        {plan.name === 'Pro' && <li className="flex items-center gap-2 text-indigo-300 font-bold underline decoration-indigo-500/30">✅ Priority Processing</li>}
                        {plan.billingCycle === 'year' && (
                            <li className="flex items-center gap-3 text-sm text-green-400 font-bold">
                                <span className="text-green-500">★</span> 
                                <span>Annual Loyalty Priority</span>
                            </li>
                        )}
                    </ul>
                    <button 
                        onClick={() => {
                            if (isCurrent) return;
                            const token = localStorage.getItem('access_token');
                            fetch(`${API_URL}/subscriptions/checkout`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ planId: plan.id })
                            }).then(res => res.json()).then(data => { 
                                if(data.razorpayOrderId) {
                                    openRazorpayCheckout(data);
                                }
                            });
                        }}
                        className={`w-full py-4 rounded-2xl font-bold transition-all ${isCurrent ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                        {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade Now' : 'Switch Plan'}
                    </button>
                </div>
            );
        })}
        </div>
    </div>
  );
}
