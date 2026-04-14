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
    console.log(`[SubscriptionsService] creating checkout session for user: ${userId}, plan: ${planId}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    
    if (!user) console.warn(`[SubscriptionsService] User not found: ${userId}`);
    if (!plan) console.warn(`[SubscriptionsService] Plan not found: ${planId}`);

    if (!user || !plan) throw new BadRequestException("Invalid User or Subscription Plan.");

    // RAZORPAY ORDER CREATION with metadata (notes)
    const order = await this.razorpayService.createOrder(
        plan.price, 
        plan.currency || 'INR', 
        `receipt_${Date.now()}`,
        { userId, planId } // Webhook will use these if frontend is closed
    );
    
    return {  
        razorpayOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        profile: {
            name: user.name || '',
            email: user.email,
        },
        planId: plan.id,
        message: "Razorpay Order Initialized" 
    };
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
