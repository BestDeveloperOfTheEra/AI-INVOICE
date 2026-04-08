import { Controller, Post, Get, UseGuards, Req, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getAllPlans();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  async getStatus(@Req() req: any) {
    return this.subscriptionsService.getSubscriptionStatus(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  async checkout(@Req() req: any, @Body() body: { planId: string }) {
    return this.subscriptionsService.createCheckoutSession(req.user.id, body.planId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('confirm-payment')
  async confirm(@Req() req: any, @Body() body: { planId: string }) {
    return this.subscriptionsService.confirmPayment(req.user.id, body.planId);
  }
}
