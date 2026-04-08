import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: any;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
    });
  }

  async createOrder(amount: number, currency: string, receipt: string, notes?: any) {
    try {
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in subunits (paise)
        currency: currency,
        receipt: receipt,
        notes: notes,
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      this.logger.error('Razorpay Order Creation Failed:', error);
      throw new Error('Could not initialize payment with Razorpay.');
    }
  }

  // Verification for Frontend Success Callback
  verifyPayment(orderId: string, paymentId: string, signature: string) {
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
  }

  // Verification for Webhook Events
  verifyWebhookSignature(payload: string, signature: string, secret: string) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
  }
}
