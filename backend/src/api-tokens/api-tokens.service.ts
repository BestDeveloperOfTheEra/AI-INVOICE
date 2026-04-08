import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class ApiTokensService {
  constructor(private prisma: PrismaService) {}

  async generateToken(userId: string, name: string) {
    const rawToken = `dt_${randomBytes(24).toString('hex')}`;
    const tokenHash = this.hashToken(rawToken);

    const apiToken = await this.prisma.apiToken.create({
      data: {
        userId,
        name,
        tokenHash,
        isActive: true,
      },
    });

    return {
      ...apiToken,
      rawToken, // Only return the raw token once during creation
    };
  }

  async listTokens(userId: string) {
    return this.prisma.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeToken(userId: string, tokenId: string) {
    return this.prisma.apiToken.deleteMany({
      where: { id: tokenId, userId },
    });
  }

  async validateToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const token = await this.prisma.apiToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token || !token.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Update last used at
    await this.prisma.apiToken.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });

    return token.user;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
