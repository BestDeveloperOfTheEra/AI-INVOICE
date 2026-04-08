import { Controller, Get, UseGuards, Req, ForbiddenException, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('metrics')
  async getMetrics(@Req() req: any) {
    const userRole = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true }
    });
    
    // Role-Based Access Control (RBAC) Guard
    if (userRole?.role.name !== 'Admin') {
      throw new ForbiddenException("You do not have Administrator privileges! This route is secure.");
    }

    const metrics = await this.adminService.getDashboardMetrics();
    const plans = await this.prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' }});
    return { ...metrics, plans };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('update-plan')
  async updatePlan(@Req() req: any, @Body() body: any) {
     const userRole = await this.prisma.user.findUnique({ where: { id: req.user.id }, include: { role: true } });
     if (userRole?.role.name !== 'Admin') throw new ForbiddenException("Unauthorized");

     if (body.id === 'NEW') {
         return this.prisma.subscriptionPlan.create({
             data: { name: body.name, price: Number(body.price), quotaPages: Number(body.quotaPages), moduleType: 'invoice' }
         });
     } else {
         return this.prisma.subscriptionPlan.update({
             where: { id: body.id },
             data: { name: body.name, price: Number(body.price), quotaPages: Number(body.quotaPages) }
         });
     }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('delete-plan')
  async deletePlan(@Req() req: any, @Body() body: { id: string }) {
     const userRole = await this.prisma.user.findUnique({ where: { id: req.user.id }, include: { role: true } });
     if (userRole?.role.name !== 'Admin') throw new ForbiddenException("Unauthorized");

     // Manually cascade delete any actual subscriptions mapped to this tier
     // Otherwise Prisma throws a Foreign Key (P2003) constraint violation!
     await this.prisma.userSubscription.deleteMany({
         where: { planId: body.id }
     });

     return this.prisma.subscriptionPlan.delete({
         where: { id: body.id }
     });
  }

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('manage_roles')
  @Get('roles')
  async getRoles() {
    return this.prisma.role.findMany({
      include: { _count: { select: { users: true } } }
    });
  }

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('manage_roles')
  @Post('roles')
  async createRole(@Body() body: { name: string, permissions: string }) {
    return this.prisma.role.create({
      data: { name: body.name, permissions: body.permissions }
    });
  }

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('manage_roles')
  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() body: { name: string, permissions: string }) {
    return this.prisma.role.update({
      where: { id },
      data: { name: body.name, permissions: body.permissions }
    });
  }

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('manage_roles')
  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if ((role?._count?.users ?? 0) > 0) throw new ForbiddenException("Cannot delete role assigned to users");
    if (role?.name === 'Admin' || role?.name === 'Customer') throw new ForbiddenException("Cannot delete core system roles");
    return this.prisma.role.delete({ where: { id } });
  }

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('manage_users')
  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany({
      include: { role: true, _count: { select: { orders: true, documents: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('manage_users')
  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() body: { roleId: string }) {
    const targetUser = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (targetUser?.role.name === 'Admin') throw new ForbiddenException("Cannot reassign SuperAdmin role through this endpoint");
    
    return this.prisma.user.update({
      where: { id },
      data: { roleId: body.roleId },
      include: { role: true }
    });
  }

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('manage_users')
  @Put('users/:id/block')
  async toggleBlockUser(@Param('id') id: string, @Body() body: { isBlocked: boolean }) {
    const targetUser = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (targetUser?.role.name === 'Admin') throw new ForbiddenException("Cannot block Admins");
    
    return this.prisma.user.update({
      where: { id },
      data: { isBlocked: body.isBlocked }
    });
  }
}
