import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService
  ) {}

  async getSubscriptionStatus(userId: string) {
    const sub = await this.prisma.userSubscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true }
    });
    
    if (!sub) return { isActive: false, credits: 0 };
    return { isActive: true, credits: sub.creditsRemaining, plan: sub.plan.name };
  }

  async getAllPlans() {
    // Auto-seed if empty dynamically to ensure the UI has something to show!
    const count = await this.prisma.subscriptionPlan.count();
    if (count !== 4) {
      await this.prisma.subscriptionPlan.deleteMany();
      await this.prisma.subscriptionPlan.createMany({
        data: [
          { name: 'Free', price: 0, quotaPages: 10, moduleType: 'invoice', billingCycle: 'month', currency: 'INR', paddleProductId: 'free_plan' },
          { name: 'Starter', price: 499, quotaPages: 200, moduleType: 'invoice', billingCycle: 'month', currency: 'INR', paddleProductId: 'starter_plan_499' },
          { name: 'Pro', price: 999, quotaPages: 25000, moduleType: 'invoice', billingCycle: 'month', currency: 'INR', paddleProductId: 'pro_plan_999' },
          { name: 'Pro', price: 9999, quotaPages: 300000, moduleType: 'invoice', billingCycle: 'year', currency: 'INR', paddleProductId: 'pro_annual_9999' }
        ]
      });
    }
    return this.prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
  }

  async createCheckoutSession(userId: string, planId: string) {
    try {
        console.log(`[SubscriptionsService] initiating checkout for user: ${userId}, plan: ${planId}`);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        
        if (!user || !plan) {
            throw new BadRequestException("User or Subscription Plan not found in database.");
        }

        // RAZORPAY ORDER CREATION
        const order = await this.razorpayService.createOrder(
            plan.price, 
            plan.currency || 'INR', 
            `receipt_${Date.now()}`,
            { userId, planId }
        );
        
        return {  
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID || '',
            profile: {
                name: user.name || '',
                email: user.email,
            },
            planId: plan.id,
            message: "Razorpay Order Initialized" 
        };
    } catch (error: any) {
        console.error('[SubscriptionsService] Checkout initialization failed:', error.message);
        throw new BadRequestException(error.message || "Failed to initialize payment gateway. Check configuration.");
    }
  }

  async confirmPayment(userId: string, planId: string, razorpayData?: any) {
    // Verify Razorpay Signature if provided
    if (razorpayData && razorpayData.razorpay_signature) {
        const isValid = this.razorpayService.verifyPayment(
            razorpayData.razorpay_order_id,
            razorpayData.razorpay_payment_id,
            razorpayData.razorpay_signature
        );
        if (!isValid) throw new BadRequestException("Payment signature verification failed.");
    }

    return await this.fulfillSubscription(
        userId, 
        planId, 
        razorpayData?.razorpay_payment_id || 'manual_' + Date.now()
    );
  }

  /**
   * Centralized method to fulfill a subscription.
   * Called by both the manual confirmation and the webhook handler.
   */
    );
  }

  /**
   * Razorpay Webhook Handler
   */
  async handleRazorpayWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.');
        return { status: 'error', message: 'Secret missing' };
    }

    // VERIFY SIGNATURE
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (expectedSignature !== signature) {
        console.warn('[Webhook] Invalid Webhook Signature received.');
        throw new BadRequestException('Invalid signature');
    }

    // PARSE BODY
    const event = JSON.parse(rawBody.toString());
    console.log(`[Webhook] Received Razorpay event: ${event.event}`);

    // FULFILL SUBSCRIPTION ON SUCCESSFUL PAYMENT
    // event.event can be 'payment.captured' or 'order.paid' depending on settings
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
        const payment = event.payload.payment.entity;
        const notes = payment.notes; // We passed userId and planId in the notes!

        if (notes && notes.userId && notes.planId) {
            console.log(`[Webhook] Fulfilling subscription for user ${notes.userId}, plan ${notes.planId}`);
            await this.fulfillSubscription(notes.userId, notes.planId, payment.id);
        } else {
            console.warn('[Webhook] Missing notes (userId/planId) in payment entity.');
        }
    }

    return { status: 'success' };
  }

  async fulfillSubscription(userId: string, planId: string, transactionId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException("Invalid Plan.");

    // Check if this transaction was already processed to prevent double-crediting
    const existingOrder = await this.prisma.order.findFirst({
        where: { transactionId, status: 'paid' }
    });
    if (existingOrder) return { success: true, planName: plan.name, alreadyProcessed: true };

    const now = new Date();
    const endDate = new Date();
    if (plan.billingCycle === 'year') {
        endDate.setFullYear(now.getFullYear() + 1);
    } else {
        endDate.setMonth(now.getMonth() + 1);
    }

    // Deactivate old sub
    await this.prisma.userSubscription.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'cancelled' }
    });

    await this.prisma.userSubscription.create({
        data: {
            userId,
            planId: plan.id,
            status: 'active',
            creditsRemaining: plan.quotaPages,
            startDate: now,
            endDate: endDate
        }
    });

    await this.prisma.order.create({
        data: {
            userId,
            amount: plan.price,
            status: 'paid',
            paymentMethod: 'razorpay',
            transactionId: transactionId
        }
    });

    return { success: true, planName: plan.name };
  }
}
