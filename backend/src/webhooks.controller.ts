import { Controller, Post, Body, Headers, BadRequestException, Logger, RawBodyRequest, Req } from '@nestjs/common';
import * as express from 'express';
import { PrismaService } from './prisma.service';
import { SubscriptionsService } from './subscriptions/subscriptions.service';
import { RazorpayService } from './subscriptions/razorpay.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
    private razorpayService: RazorpayService
  ) {}

  @Post('paddle')
  async handlePaddleWebhook(
    @Body() payload: any,
    @Headers('paddle-signature') signature: string,
  ) {
    this.logger.log(`Received Paddle Webhook: ${payload.alert_name}`);
    // ... existing Paddle logic ...
  }

  @Post('razorpay')
  async handleRazorpayWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any
  ) {
    this.logger.log(`Received Razorpay Webhook Event: ${body.event}`);

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
        // Use rawBody for accurate signature verification
        const rawBody = (req as any).rawBody;
        const payload = rawBody ? rawBody.toString() : JSON.stringify(body);
        const isValid = this.razorpayService.verifyWebhookSignature(payload, signature, webhookSecret);
        if (!isValid) {
            this.logger.error('Invalid Razorpay Webhook Signature');
            throw new BadRequestException('Invalid Signature');
        }
    }

    try {
        if (body.event === 'order.paid' || body.event === 'payment.captured') {
            const orderEntity = body.payload.order?.entity || body.payload.payment.entity;
            const notes = orderEntity.notes;
            
            if (notes && notes.userId && notes.planId) {
                const transactionId = body.payload.payment?.entity?.id || orderEntity.id;
                this.logger.log(`Fulfilling Razorpay Order: ${orderEntity.id} for User: ${notes.userId}`);
                
                await this.subscriptionsService.fulfillSubscription(
                    notes.userId,
                    notes.planId,
                    transactionId
                );
            } else {
                this.logger.warn(`Razorpay Webhook missing notes/metadata: ${body.event}`);
            }
        }
    } catch (error) {
        this.logger.error('Failed to process Razorpay Webhook:', error);
        throw new BadRequestException('Webhook processing failed');
    }

    return { status: 'success' };
  }
}
