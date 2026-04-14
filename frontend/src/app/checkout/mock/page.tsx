'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { API_URL } from '@/lib/constants';
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const [plan, setPlan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!planId) return;
    fetch(`${API_URL}/subscriptions/plans`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((p: any) => p.id === planId);
        setPlan(found);
      });
  }, [planId]);

  const handlePay = async () => {
    setIsProcessing(true);
    const token = localStorage.getItem('access_token');

    try {
      // Simulate network delay for "Processing Payment"
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await fetch('http://127.0.0.1:3001/subscriptions/confirm-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });

      if (!res.ok) throw new Error('Payment confirmation failed');

      router.push('/dashboard?payment=success');
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  if (!plan) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Secure Checkout...</div>;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 bg-mesh">
      <div className="w-full max-w-lg bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div className="text-xl font-bold tracking-tight text-white">Data<span className="text-blue-500">Extract</span> Pay</div>
          <div className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-500/20">Secure Mock Gateway</div>
        </div>

        {/* Order Summary */}
        <div className="mb-8">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Order Summary</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">{plan.name} Plan ({plan.billingCycle === 'year' ? 'Annual' : 'Monthly'})</span>
            <span className="text-white font-bold">${plan.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Tax (Mock 0%)</span>
            <span>$0.00</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl mb-8 border border-white/10">
          <span className="text-gray-300 font-medium">Total to Pay</span>
          <span className="text-3xl font-black text-white">${plan.price.toFixed(2)}</span>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{error}</div>}

        {/* Action */}
        <button
          onClick={handlePay}
          disabled={isProcessing}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${isProcessing ? 'bg-blue-600/50 text-white/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]'}`}
        >
          {isProcessing ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Processing Secure Payment...
            </>
          ) : (
            'Complete Purchase'
          )}
        </button>

        <p className="mt-6 text-center text-xs text-gray-500 px-4">
          Authorized by **DataExtract AI**. No real money will be deducted during this demonstration.
          All subscriptions are finalized via our secure terminal.
        </p>

        <button onClick={() => router.back()} className="mt-8 w-full text-center text-gray-400 text-sm hover:text-white transition-colors">
          Cancel and Return
        </button>
      </div>
    </div>
  );
}

export default function MockCheckout() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white italic">Initializing Secure Session...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
