import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiryReminders() {
    this.logger.log('Running Scheduled Task: Subscription Expiry Reminders');

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(now.getDate() + 1);
    oneDayFromNow.setHours(23, 59, 59, 999);

    // Find active subscriptions ending in ~3 days or ~1 day
    // We use a range to capture those ending exactly on these days
    const expiringSoon = await this.prisma.userSubscription.findMany({
      where: {
        status: 'active',
        endDate: {
          lte: threeDaysFromNow,
          gt: now,
        },
      },
      include: {
        user: true,
      },
    });

    for (const sub of expiringSoon) {
      if (!sub.endDate) continue;

      const diffTime = sub.endDate.getTime() - now.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      this.logger.log(`Sub ID: ${sub.id}, EndDate: ${sub.endDate.toISOString()}, DiffDays: ${diffDays}`);

      // Only notify if 3 or 1 days remaining AND not already notified today
      if (diffDays === 3 || diffDays === 1) {
        const todayStr = now.toISOString().split('T')[0];
        const lastSentStr = sub.lastExpiryReminderSentAt?.toISOString().split('T')[0];

        if (lastSentStr !== todayStr) {
          await this.notificationsService.sendSubscriptionReminder(sub.user.email, diffDays);
          
          await this.prisma.userSubscription.update({
            where: { id: sub.id },
            data: { lastExpiryReminderSentAt: now },
          });
        }
      }
    }

    this.logger.log(`Checked ${expiringSoon.length} subscriptions for expiry.`);
  }
}
