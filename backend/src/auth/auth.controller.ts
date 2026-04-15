import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: Record<string, any>) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: Record<string, any>) {
    return this.authService.register(body);
  }

  /** Google Sign-In: receives the credential (id_token) from Google Identity Services */
  @Post('google/token')
  @HttpCode(HttpStatus.OK)
  async googleToken(@Body() body: { credential: string }) {
    if (!body.credential) {
      throw new BadRequestException('credential is required');
    }
    return this.authService.loginWithGoogle(body.credential);
  }

  /** Apple Sign-In: receives the id_token from Sign In with Apple JS */
  @Post('apple/token')
  @HttpCode(HttpStatus.OK)
  async appleToken(@Body() body: { id_token: string; user?: { name?: { firstName?: string; lastName?: string }; email?: string } }) {
    if (!body.id_token) {
      throw new BadRequestException('id_token is required');
    }
    return this.authService.loginWithApple(body.id_token, body.user);
  }
}
