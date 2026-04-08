import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const totalUsers = await this.prisma.user.count();
    const totalInvoices = await this.prisma.documentProcess.count({ where: { moduleType: 'invoice' } });
    
    // ACCOUNTING ENGINE CALCULATION
    const orders = await this.prisma.order.findMany({ where: { status: 'paid' } });
    
    let grossRevenue = 0;
    let gatewayFees = 0;
    
    orders.forEach(order => {
        grossRevenue += order.amount;
        // Standard Stripe Gateway Fees: 2.9% + 30 cents per transaction
        gatewayFees += (order.amount * 0.029) + 0.30;
    });

    // 20% Standard VAT / Digital Sales Tax Allocation
    const taxOwed = grossRevenue * 0.20;

    // AI Compute & Vendor Extraction Costs ($0.05 per processed page)
    const extractions = await this.prisma.documentProcess.aggregate({ _sum: { pageCount: true } });
    let aiComputeCosts = (extractions._sum.pageCount || 0) * 0.05;
    if (aiComputeCosts === 0 && totalInvoices > 0) aiComputeCosts = totalInvoices * 0.05; // Fallback for old seeds

    // Calculate Final Net Take-home Profit
    const netProfit = grossRevenue - taxOwed - gatewayFees - aiComputeCosts;

    const recentUsers = await this.prisma.user.findMany({
      orderBy: { id: 'desc' },
      take: 6,
      include: { role: true }
    });

    const recentOrders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { user: true }
    });

    return {
      accounting: {
          runningOrders: orders.length,
          grossRevenue: Number(grossRevenue.toFixed(2)),
          taxReserved: Number(taxOwed.toFixed(2)),
          gatewayFees: Number(gatewayFees.toFixed(2)),
          aiComputeCosts: Number(aiComputeCosts.toFixed(2)),
          netProfit: Number(netProfit.toFixed(2))
      },
      totalUsers,
      totalInvoicesProcessed: totalInvoices,
      recentUsers: recentUsers.map(u => ({ email: u.email, role: u.role.name })),
      recentOrders: recentOrders.map(o => ({ id: o.id, amount: o.amount, email: o.user?.email || 'Deleted User', date: o.createdAt, status: o.status, txId: o.transactionId }))
    };
  }
}
