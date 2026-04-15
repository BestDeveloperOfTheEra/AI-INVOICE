import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { role: true } });
  }

  async findOrCreateOAuthUser(data: {
    email: string;
    name?: string;
    avatarUrl?: string;
    oauthId: string;
    authProvider: 'google' | 'apple';
  }) {
    // 1. Try to find existing user (by email)
    let user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { role: true },
    });

    if (user) {
      // Update oauth fields if not set yet (e.g. user registered with email first)
      if (!user.oauthId || user.authProvider === 'email') {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            oauthId: data.oauthId,
            authProvider: data.authProvider,
            name: user.name ?? data.name,
            avatarUrl: user.avatarUrl ?? data.avatarUrl,
          },
          include: { role: true },
        });
      }
      return user;
    }

    // 2. Create a new user (no password)
    let role = await this.prisma.role.findUnique({ where: { name: 'Customer' } });
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: 'Customer', permissions: 'upload_invoice,export_data' },
      });
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        oauthId: data.oauthId,
        authProvider: data.authProvider,
        roleId: role.id,
      },
      include: { role: true },
    });
  }

  async create(data: any) {
    let role = await this.prisma.role.findUnique({ where: { name: 'Customer' } });
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: 'Customer', permissions: 'upload_invoice,export_data' }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hash,
        roleId: role.id,
      },
      include: { role: true }
    });
  }

  async updateProfile(userId: string, data: { name?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
      select: { id: true, email: true, name: true, avatarUrl: true, role: true }
    });
  }

  async updateAvatar(userId: string, filename: string) {
    const avatarUrl = `/users/avatar/${filename}`;
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, email: true, name: true, avatarUrl: true, role: true }
    });
  }
}
