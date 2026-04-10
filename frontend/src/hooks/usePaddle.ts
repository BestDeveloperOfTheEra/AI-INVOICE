'use client';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Paddle: any;
  }
}

export const usePaddle = () => {
  const [isPaddleLoaded, setIsPaddleLoaded] = useState(false);

  useEffect(() => {
    const checkPaddle = setInterval(() => {
      if (window.Paddle) {
        setIsPaddleLoaded(true);
        clearInterval(checkPaddle);
      }
    }, 500);
    return () => clearInterval(checkPaddle);
  }, []);

  const openPaddleCheckout = (data: { vendorId: number; productId: string; email: string; passthrough: string; currency?: string }) => {
    if (!window.Paddle) {
      alert('Payment system is still loading. Please try again in a few seconds.');
      return;
    }

    // Set to Sandbox if using test vendor ID
    if (data.vendorId === 40348) {
        window.Paddle.Environment.set('sandbox');
    }

    window.Paddle.Setup({ vendor: data.vendorId });
    
    const checkoutOptions: any = {
      product: data.productId,
      email: data.email,
      passthrough: data.passthrough,
      successCallback: (data: any) => {
        console.log('Paddle Success:', data);
        window.location.href = '/dashboard?payment=success';
      },
      closeCallback: (data: any) => {
        console.log('Paddle Closed:', data);
      }
    };

    if (data.currency) {
        checkoutOptions.currency = data.currency;
    }

    window.Paddle.Checkout.open(checkoutOptions);
  };

  return { openPaddleCheckout, isPaddleLoaded };
};
