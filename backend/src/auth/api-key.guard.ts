import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiTokensService } from '../api-tokens/api-tokens.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiTokensService: ApiTokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      // If no API key, let other guards (like JWT) handle it if present
      return true; 
    }

    try {
      const user = await this.apiTokensService.validateToken(apiKey);
      request.user = user;
      request.isApiKeyAuth = true;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid API Key');
    }
  }
}
