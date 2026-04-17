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
    // FORCE RESET PLANS TO APPLY NEW PRICES
    const firstPlan = await this.prisma.subscriptionPlan.findFirst({ where: { name: 'Starter', billingCycle: 'month' } });
    if (!firstPlan || firstPlan.price !== 499) { 
      console.log('[SubscriptionsService] Prices changed or plans missing. Re-seeding...');
      await this.prisma.subscriptionPlan.deleteMany();
      await this.prisma.subscriptionPlan.createMany({
        data: [
          // MONTHLY
          { name: 'Free', price: 0, quotaPages: 10, moduleType: 'invoice', billingCycle: 'month', currency: 'INR', paddleProductId: 'free_trial' },
          { name: 'Starter', price: 499, quotaPages: 100, moduleType: 'invoice', billingCycle: 'month', currency: 'INR', paddleProductId: 'starter_indiv' },
          { name: 'Pro', price: 1499, quotaPages: 500, moduleType: 'invoice', billingCycle: 'month', currency: 'INR', paddleProductId: 'pro_small_biz' },
          { name: 'Business', price: 4999, quotaPages: 2000, moduleType: 'invoice', billingCycle: 'month', currency: 'INR', paddleProductId: 'business_teams' },
          
          // ANNUAL (20% OFF approx)
          { name: 'Free', price: 0, quotaPages: 120, moduleType: 'invoice', billingCycle: 'year', currency: 'INR', paddleProductId: 'free_annual' },
          { name: 'Starter', price: 4788, quotaPages: 1200, moduleType: 'invoice', billingCycle: 'year', currency: 'INR', paddleProductId: 'starter_annual' },
          { name: 'Pro', price: 14388, quotaPages: 6000, moduleType: 'invoice', billingCycle: 'year', currency: 'INR', paddleProductId: 'pro_annual' },
          { name: 'Business', price: 47988, quotaPages: 24000, moduleType: 'invoice', billingCycle: 'year', currency: 'INR', paddleProductId: 'business_annual' },

          // ENTERPRISE
          { name: 'Enterprise', price: 0, quotaPages: 999999, moduleType: 'invoice', billingCycle: 'month', currency: 'INR', paddleProductId: 'enterprise' }
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
    const eventName = event.event;
    console.log(`[Webhook] Processing Razorpay Event: ${eventName}`);

    switch (eventName) {
        case 'payment.captured':
        case 'order.paid':
        case 'payment_link.paid':
        case 'invoice.paid':
            const payment = event.payload.payment?.entity || event.payload.order?.entity || event.payload.payment_link?.entity;
            const notes = payment?.notes || {};
            if (notes.userId && notes.planId) {
                console.log(`[Webhook] FULFILLING: User ${notes.userId}, Plan ${notes.planId}`);
                await this.fulfillSubscription(notes.userId, notes.planId, payment.id || payment.order_id);
            }
            break;

        case 'payment.failed':
        case 'payment_link.expired':
        case 'invoice.expired':
            console.warn(`[Webhook] PAYMENT FAILED: Event ${eventName}. Payload:`, JSON.stringify(event.payload));
            // Optional: Notify user or log in internal dashboard
            break;

        case 'refund.processed':
            const refundPayment = event.payload.payment.entity;
            const rNotes = refundPayment.notes || {};
            if (rNotes.userId) {
                console.log(`[Webhook] REFUNDING: Revoking access for User ${rNotes.userId}`);
                await this.prisma.userSubscription.updateMany({
                   where: { userId: rNotes.userId, status: 'active' },
                   data: { status: 'cancelled' }
                });
            }
            break;

        case 'subscription.cancelled':
        case 'subscription.halted':
            const sub = event.payload.subscription.entity;
            const subNotes = sub.notes || {};
            if (subNotes.userId) {
                await this.prisma.userSubscription.updateMany({
                    where: { userId: subNotes.userId, status: 'active' },
                    data: { status: 'cancelled' }
                });
            }
            break;

        default:
            console.log(`[Webhook] INFO: Received unhandled but logged event: ${eventName}`);
            break;
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
