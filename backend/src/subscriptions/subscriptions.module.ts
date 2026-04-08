import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { WebhooksController } from '../webhooks.controller';
import { RazorpayService } from './razorpay.service';
import { SubscriptionCronService } from './subscription-cron.service';
import { NotificationsService } from '../notifications.service';

@Module({
  controllers: [SubscriptionsController, WebhooksController],
  providers: [
    SubscriptionsService, 
    RazorpayService, 
    SubscriptionCronService, 
    NotificationsService
  ]
})
export class SubscriptionsModule {}
