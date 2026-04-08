import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';
import { ApiKeyGuard } from './api-key.guard';
import { CombinedAuthGuard } from './combined-auth.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ApiTokensModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-for-antigravity',
      signOptions: { expiresIn: '60d' }, // Increased for easier testing, reduce for prod
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ApiKeyGuard, CombinedAuthGuard],
  exports: [ApiKeyGuard, CombinedAuthGuard],
})
export class AuthModule {}
