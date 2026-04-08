import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
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
}
