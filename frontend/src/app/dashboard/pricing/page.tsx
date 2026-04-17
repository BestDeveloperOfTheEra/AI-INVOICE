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
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/subscriptions/plans`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch plans');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPlans(data);
        } else {
          console.error('API returned non-array data:', data);
          setPlans([]);
        }
      })
      .catch(err => {
        console.error('Error fetching plans:', err);
        setPlans([]);
      });
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pb-8">
        {(Array.isArray(plans) ? plans : [])
            .filter(p => p.billingCycle === billingCycle || p.name === 'Enterprise')
            .sort((a, b) => {
              if (a.name === 'Enterprise') return 1;
              if (b.name === 'Enterprise') return -1;
              return a.price - b.price;
            })
            .map((plan) => {
                const currentPlan = plans.find(p => p.name === planName);
                const currentPrice = currentPlan?.price || 0;
                const isCurrent = plan.name === planName;
                const isUpgrade = plan.price > currentPrice;

                return (
                    <div key={plan.id} className={`relative group p-6 rounded-3xl bg-white/[0.03] border transition-all hover:scale-[1.02] flex flex-col items-center text-center ${isCurrent ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-white/10 hover:bg-white/[0.05]'}`}>
                        {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest z-20">Active</div>}
                        {!isCurrent && plan.name === 'Pro' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30 z-20">Recommended</div>}
                        {!isCurrent && plan.name === 'Business' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/30 z-20">Scaleup</div>}
                        
                        <div className="mb-4">
                            <h4 className="text-lg font-bold text-white mb-1">{plan.name}</h4>
                            <p className="text-gray-500 text-[10px]">
                                {plan.name === 'Free' && "Best For: Testing"}
                                {plan.name === 'Starter' && "Best For: Freelancers"}
                                {plan.name === 'Pro' && "Best For: Small businesses"}
                                {plan.name === 'Business' && "Best For: Agencies/Finance teams"}
                                {plan.name === 'Enterprise' && "Best For: API-heavy"}
                            </p>
                        </div>

                        <div className="text-3xl font-black text-white mb-6">
                            {plan.name === 'Enterprise' ? 'Custom' : `₹${plan.price}`}
                            {plan.name !== 'Enterprise' && <span className="text-xs font-medium text-gray-500 ml-1">/{plan.billingCycle === 'year' ? 'yr' : 'mo'}</span>}
                        </div>

                        <ul className="text-gray-400 text-xs space-y-3 mb-8 text-left w-full flex-1 border-t border-white/5 pt-6">
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span className="font-bold text-white">{plan.name === 'Enterprise' ? 'Unlimited' : plan.quotaPages.toLocaleString()}</span> Pages {plan.name === 'Enterprise' ? '' : (plan.billingCycle === 'year' ? '/yr' : '/mo')}
                            </li>
                            {plan.name !== 'Free' && <li className="flex items-center gap-2 text-blue-300 font-medium">✅ Bulk Upload Included</li>}
                            <li className="flex items-center gap-2">✅ AI Extraction API</li>
                            <li className="flex items-center gap-2">✅ GST-Ready Export</li>
                            {(plan.name === 'Pro' || plan.name === 'Business') && <li className="flex items-center gap-2 text-indigo-300 font-bold">✅ Priority Support</li>}
                            {plan.name === 'Enterprise' && <li className="flex items-center gap-2 text-green-400 font-bold">✅ Account Manager</li>}
                        </ul>

                        <button 
                            onClick={() => {
                                if (isCurrent || isProcessingUpgrade) return;
                                if (plan.name === 'Enterprise') { window.location.href='mailto:sales@autoextract.in'; return; }
                                setIsProcessingUpgrade(plan.id);
                                const token = localStorage.getItem('access_token');
                                fetch(`${API_URL}/subscriptions/checkout`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
                                    body: JSON.stringify({ planId: plan.id })
                                })
                                .then(async res => {
                                    if (!res.ok) {
                                        const err = await res.json().catch(() => ({}));
                                        throw new Error(err.message || 'Checkout failed');
                                    }
                                    return res.json();
                                })
                                .then(data => { 
                                    if(data.razorpayOrderId) {
                                        openRazorpayCheckout(data);
                                    } else {
                                        throw new Error('Invalid response from server');
                                    }
                                })
                                .catch(err => {
                                    console.error('Upgrade error:', err);
                                    alert(`Failed to initiate upgrade: ${err.message}`);
                                })
                                .finally(() => setIsProcessingUpgrade(null));
                            }}
                            disabled={isProcessingUpgrade !== null}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all mt-auto ${isCurrent ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 shadow-lg shadow-blue-600/10'}`}
                        >
                            {isCurrent ? 'Active Plan' : isProcessingUpgrade === plan.id ? 'Processing...' : plan.name === 'Enterprise' ? 'Contact Sales' : isUpgrade ? 'Upgrade Now' : 'Switch Plan'}
                        </button>
                    </div>
                );
            })}
        </div>
    </div>
  );
}
