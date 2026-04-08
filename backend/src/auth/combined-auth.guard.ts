import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Try API Key first
    const hasApiKey = !!request.headers['x-api-key'];
    if (hasApiKey) {
      try {
        const passed = await this.apiKeyGuard.canActivate(context);
        if (passed) return true;
      } catch (e) {
        // Fall through to JWT if API key failed? 
        // Usually, if they sent an API key and it's invalid, we should fail.
        throw e;
      }
    }

    // 2. Fallback to JWT AuthGuard
    // Note: We need to instantiate the AuthGuard manually here or use a different approach.
    // Since AuthGuard('jwt') is a class, we can extend it.
    return new (AuthGuard('jwt'))().canActivate(context) as Promise<boolean>;
  }
}
