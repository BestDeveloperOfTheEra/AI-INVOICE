import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendSubscriptionReminder(email: string, daysRemaining: number) {
    this.logger.log(`[SIMULATED EMAIL] Sending subscription reminder to ${email}: Your plan expires in ${daysRemaining} day(s). Please renew to avoid service interruption.`);
    
    // In a real production environment, you would use a service like Nodemailer, SendGrid, or AWS SES here.
    // Example:
    // await this.mailService.send({
    //   to: email,
    //   subject: 'Subscription Expiry Reminder',
    //   template: 'expiry-reminder',
    //   context: { daysRemaining }
    // });

    return true;
  }
}
