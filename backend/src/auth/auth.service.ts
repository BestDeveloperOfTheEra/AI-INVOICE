import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OAuthService } from './oauth.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private oauthService: OAuthService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role?.name || 'Customer' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(body: any) {
    const existing = await this.usersService.findOne(body.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }
    const newUser = await this.usersService.create(body);
    return this.login(newUser);
  }

  async loginWithGoogle(credential: string) {
    const googleUser = await this.oauthService.verifyGoogleToken(credential);
    const user = await this.usersService.findOrCreateOAuthUser({
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
      oauthId: googleUser.googleId,
      authProvider: 'google',
    });
    return this.login(user);
  }

  async loginWithApple(
    idToken: string,
    appleUser?: { name?: { firstName?: string; lastName?: string }; email?: string },
  ) {
    const applePayload = await this.oauthService.verifyAppleToken(idToken);
    // Apple only sends the name on the very first sign-in
    const name = appleUser?.name
      ? `${appleUser.name.firstName ?? ''} ${appleUser.name.lastName ?? ''}`.trim()
      : undefined;
    const user = await this.usersService.findOrCreateOAuthUser({
      email: applePayload.email,
      name,
      oauthId: applePayload.appleId,
      authProvider: 'apple',
    });
    return this.login(user);
  }
}
