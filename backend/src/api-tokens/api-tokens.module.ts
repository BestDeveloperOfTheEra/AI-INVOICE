import { Module } from '@nestjs/common';
import { ApiTokensController } from './api-tokens.controller';
import { ApiTokensService } from './api-tokens.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ApiTokensController],
  providers: [ApiTokensService, PrismaService],
  exports: [ApiTokensService],
})
export class ApiTokensModule {}
