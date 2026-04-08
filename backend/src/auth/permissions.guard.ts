import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    });

    // If no role or user is blocked
    if (!userWithRole || userWithRole.isBlocked) {
      throw new ForbiddenException('User is blocked or has no assigned role');
    }

    // Admins always have access, or if no specific permissions are required, allow access
    if (userWithRole.role.name === 'Admin') {
        return true;
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }

    const userPermissions = userWithRole.role.permissions.split(',').map(p => p.trim());
    
    // Check if user has ALL required permissions (can also implement ANY depending on logic)
    const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));
    
    if (!hasPermission) {
        throw new ForbiddenException(`You lack required permissions: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
