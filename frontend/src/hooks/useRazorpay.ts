'use client';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/constants';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const useRazorpay = () => {
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  useEffect(() => {
    const checkRazorpay = setInterval(() => {
      if (window.Razorpay) {
        setIsRazorpayLoaded(true);
        clearInterval(checkRazorpay);
      }
    }, 500);
    return () => clearInterval(checkRazorpay);
  }, []);

  const openRazorpayCheckout = (data: { 
    razorpayOrderId: string; 
    amount: number; 
    currency: string; 
    keyId: string;
    profile: { name: string; email: string };
    planId: string;
  }) => {
    if (!window.Razorpay) {
      alert('Payment system is still loading. Please try again in a few seconds.');
      return;
    }

    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "DataExtract AI",
      description: "Subscription Plan Upgrade",
      order_id: data.razorpayOrderId,
      prefill: {
        name: data.profile.name,
        email: data.profile.email,
        contact: "9999999999", // Pre-filled for sandbox/convenience
      },
      theme: {
        color: "#2563eb",
      },
      handler: async function (response: any) {
        // This is called upon successful payment
        try {
            const token = localStorage.getItem('access_token');
            const confirmRes = await fetch(`${API_URL}/subscriptions/confirm-payment`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json; charset=utf-8' 
                },
                body: JSON.stringify({
                    planId: data.planId,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                })
            });

            if (confirmRes.ok) {
                window.location.href = '/dashboard?payment=success';
            } else {
                alert("Payment verification failed. Please contact support.");
            }
        } catch (err) {
            console.error("Payment confirmation error:", err);
            alert("An error occurred while confirming your payment.");
        }
      },
      modal: {
        ondismiss: function() {
            console.log('Checkout modal closed');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return { openRazorpayCheckout, isRazorpayLoaded };
};
