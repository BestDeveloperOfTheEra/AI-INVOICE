import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as appleSignin from 'apple-signin-auth';

@Injectable()
export class OAuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyGoogleToken(credential: string): Promise<{ email: string; name?: string; picture?: string; googleId: string }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }
      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        googleId: payload.sub,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
  }

  async verifyGoogleAccessToken(accessToken: string): Promise<{ email: string; name?: string; picture?: string; googleId: string }> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      if (!response.ok) {
        throw new UnauthorizedException('Failed to fetch user info from Google');
      }
      const payload = await response.json();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google user info response');
      }
      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        googleId: payload.sub,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google access token');
    }
  }

  async verifyAppleToken(idToken: string): Promise<{ email: string; appleId: string }> {
    try {
      const payload = await appleSignin.verifyIdToken(idToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      });
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Apple token payload – email not present');
      }
      return {
        email: payload.email,
        appleId: payload.sub,
      };
    } catch {
      throw new UnauthorizedException('Invalid Apple id_token');
    }
  }
}
