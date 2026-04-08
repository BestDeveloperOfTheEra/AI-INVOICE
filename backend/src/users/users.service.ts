import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { role: true } });
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
