'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRazorpay } from '@/hooks/useRazorpay';
import { API_URL } from '@/lib/constants';

export default function Pricing() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  console.log('render plans:', plans);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const { openRazorpayCheckout } = useRazorpay();

  useEffect(() => {
    console.log('API_URL:', API_URL);

    setIsLoggedIn(!!localStorage.getItem('access_token'));

    fetch(`${API_URL}/subscriptions/plans`)
      .then(async res => {
        console.log('plans status:', res.status, 'url:', res.url);
        const json = await res.json();
        console.log('plans data:', json);

        if (!res.ok) throw new Error('Failed to fetch plans');

        if (Array.isArray(json)) {
          setPlans(json);
        } else {
          console.error('API returned non-array data:', json);
          setPlans([]);
        }
      })
      .catch(err => {
        console.error('Error fetching plans:', err);
        setPlans([]);
      });
  }, []);

  const handleSubscribe = async (planId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert("Please login to purchase a plan.");
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error(data.message || "Checkout failed");
      
      if (data.isFree) {
        alert("Free plan activated! You can now start extracted documents.");
        router.push('/dashboard');
        return;
      }

      if (data.razorpayOrderId) {
        openRazorpayCheckout(data);
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-6 py-12 gap-8 min-h-screen">
      {isLoggedIn && (
        <aside className="w-full lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible shrink-0 pt-4 lg:pt-12 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/5 pb-4 lg:pb-0 lg:pr-8 no-scrollbar">
          <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu</div>
          <button onClick={() => router.push('/dashboard?view=documents')} className="text-left px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            Extract Invoices
          </button>
          <button onClick={() => router.push('/dashboard?view=documents')} className="text-left px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            Invoice History
          </button>

          <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Settings</div>
          <button onClick={() => router.push('/dashboard?view=profile')} className="text-left px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            Update Profile
          </button>
          <button onClick={() => router.push('/dashboard?view=developer')} className="text-left px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            Developer Portal
          </button>
          <button className="text-left px-4 py-3 rounded-xl bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20">
            Subscription Plan
          </button>
          <button onClick={() => { localStorage.removeItem('access_token'); router.push('/login'); }} className="text-left px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors mt-auto">
            Logout
          </button>
        </aside>
      )}

      <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 pt-12">
        <div className="text-center mb-12 flex flex-col items-center">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase italic">Simple, transparent <span className="text-blue-600">pricing</span></h1>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 bg-gray-100 dark:bg-white/5 p-2 rounded-2xl border border-gray-200 dark:border-white/10 mb-8 backdrop-blur-md">
            <span className={`text-sm font-medium transition-colors ${billingCycle === 'month' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly Billing</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'month' ? 'year' : 'month')}
              className="w-14 h-7 bg-blue-600/20 rounded-full relative p-1 transition-colors hover:bg-blue-600/30 border border-blue-500/20"
            >
              <div className={`w-5 h-5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-transform duration-300 ${billingCycle === 'year' ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-medium transition-colors ${billingCycle === 'year' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Annually <span className="text-green-600 dark:text-green-400 text-[10px] bg-green-500/10 px-2 py-0.5 rounded-full ml-1 font-bold border border-green-500/20">SAVE 20%</span>
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">Choose the plan that's right for your business. Switch or cancel any time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[95rem] mx-auto w-full px-4 mb-20">
          {Array.isArray(plans) && plans
            .filter(p => p.billingCycle === billingCycle || p.name === 'Enterprise')
            .sort((a, b) => {
              if (a.name === 'Enterprise') return 1;
              if (b.name === 'Enterprise') return -1;
              return a.price - b.price;
            })
            .map((plan, i) => (
            <div key={plan.id} className={`p-6 rounded-3xl border flex flex-col transition-all relative group h-full ${plan.name === 'Pro' ? 'bg-blue-600/5 dark:bg-blue-600/10 border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.1)] hover:bg-blue-600/10 dark:hover:bg-blue-600/20 z-10' : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.04]'}`}>
              {plan.name === 'Pro' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(37,99,235,0.4)] border border-blue-400/30 z-20 whitespace-nowrap">Recommended</div>}
              {plan.name === 'Business' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.1em] border border-indigo-400/30 z-20 whitespace-nowrap">Scaleup</div>}

              <div className="mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 tracking-tight uppercase">{plan.name}</h3>
                <p className="text-gray-500 dark:text-gray-500 text-[10px] leading-relaxed">
                  {plan.name === 'Free' && "Best For: Testing AI OCR"}
                  {plan.name === 'Starter' && "Best For: Freelancers & Small Shops"}
                  {plan.name === 'Pro' && "Best For: SMEs & Multi-vendor Billing ⭐"}
                  {plan.name === 'Business' && "Best For: Accounts Payable Teams"}
                  {plan.name === 'Enterprise' && "Best For: High-Volume Enterprise ERP"}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                    {plan.name === 'Enterprise' ? 'Custom' : `₹${plan.price}`}
                  </span>
                  {plan.name !== 'Enterprise' && (
                    <span className="text-gray-500 font-medium text-[10px]">/{plan.billingCycle === 'year' ? 'yr' : 'mo'}</span>
                  )}
                </div>
                {plan.name !== 'Enterprise' && plan.price > 0 && (
                   <div className="text-blue-400/80 text-[10px] font-bold uppercase tracking-wider mt-1 bg-blue-400/5 inline-block px-1.5 py-0.5 rounded-sm">
                      ≈ ₹{(plan.price / (plan.quotaPages || 1)).toFixed(2)} / page
                   </div>
                )}
              </div>

              <ul className="flex flex-col gap-3 text-gray-600 dark:text-gray-400 mb-8 flex-1 border-t border-gray-100 dark:border-white/5 pt-6">
                <li className="flex items-center gap-2 text-[13px]">
                  <span className="text-blue-600 dark:text-blue-500 font-bold">✓</span>
                  <span className="font-black text-gray-900 dark:text-white">{plan.name === 'Enterprise' ? 'Unlimited' : plan.quotaPages.toLocaleString()}</span> Pages {plan.name === 'Enterprise' ? '' : (plan.billingCycle === 'year' ? '/yr' : '/mo')}
                </li>
                {plan.name === 'Free' ? (
                  <li className="flex items-center gap-2 text-[13px] text-gray-600">
                    <span className="text-gray-600">×</span> Basic Extraction Only
                  </li>
                ) : (
                  <li className="flex items-center gap-2 text-[13px]">
                    <span className="text-blue-500">✓</span> Advanced Invoice AI Engine
                  </li>
                )}
                
                {plan.name === 'Starter' || plan.name === 'Free' ? (
                   <li className="flex items-center gap-2 text-[13px] text-gray-600">
                    <span className="text-gray-600">×</span> Batch Processing
                  </li>
                ) : (
                  <li className="flex items-center gap-2 text-[13px] font-medium text-blue-300">
                    <span className="text-blue-500">✓</span> Bulk Batch Processing
                  </li>
                )}

                {plan.name === 'Business' || plan.name === 'Enterprise' ? (
                  <li className="flex items-center gap-2 text-[13px] text-indigo-300 font-bold">
                    <span className="text-indigo-500">✓</span> API Access & Webhooks
                  </li>
                ) : (
                   <li className="flex items-center gap-2 text-[13px] text-gray-600">
                    <span className="text-gray-600">×</span> API Access
                  </li>
                )}

                {plan.name === 'Enterprise' && (
                  <li className="flex items-center gap-2 text-[13px] text-green-400 font-bold">
                    <span className="text-green-500">✓</span> Dedicated Account Manager
                  </li>
                )}
              </ul>

              <button 
                onClick={() => plan.name === 'Enterprise' ? window.location.href='mailto:sales@autoextract.in' : handleSubscribe(plan.id)} 
                className={`w-full py-3 rounded-xl text-white text-sm font-bold tracking-tight transition-all active:scale-95 mt-auto ${plan.name === 'Pro' ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-gray-900 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-black dark:hover:bg-white/10'}`}>
                {plan.name === 'Free' ? 'Get Started' : plan.name === 'Enterprise' ? 'Contact Sales' : `Upgrade`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
