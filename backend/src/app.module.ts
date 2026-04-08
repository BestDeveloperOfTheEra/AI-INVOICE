import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { DocumentsModule } from './documents/documents.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { ApiTokensModule } from './api-tokens/api-tokens.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    DocumentsModule,
    SubscriptionsModule,
    AdminModule,
    ApiTokensModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
