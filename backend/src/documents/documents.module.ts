import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AiService } from './ai.service';
import { ExportsService } from './exports.service';
import { StorageService } from './storage.service';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ApiTokensModule, AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, AiService, ExportsService, StorageService]
})
export class DocumentsModule {}
