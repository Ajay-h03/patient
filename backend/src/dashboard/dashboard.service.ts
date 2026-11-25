import { Injectable } from '@nestjs/common';
import { BillStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapBill, toNumber } from '../common/money';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);

    const [totalPatients, totalBills, paidAggregate, pendingAggregate, pendingCount, recentPatients, recentBills, paidBills] =
      await Promise.all([
        this.prisma.patient.count(),
        this.prisma.bill.count(),
        this.prisma.bill.aggregate({
          where: { status: BillStatus.PAID },
          _sum: { total: true },
        }),
        this.prisma.bill.aggregate({
          where: { status: BillStatus.PENDING },
          _sum: { total: true },
        }),
        this.prisma.bill.count({ where: { status: BillStatus.PENDING } }),
        this.prisma.patient.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { _count: { select: { bills: true } } },
        }),
        this.prisma.bill.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            patient: { select: { id: true, name: true } },
          },
        }),
        this.prisma.bill.findMany({
          where: {
            status: BillStatus.PAID,
            paidAt: { gte: start },
          },
          select: { total: true, paidAt: true },
        }),
      ]);

    const monthly = Array.from({ length: 12 }, () => 0);
    for (const bill of paidBills) {
      if (!bill.paidAt) continue;
      monthly[bill.paidAt.getMonth()] += toNumber(bill.total);
    }

    return {
      stats: {
        totalPatients,
        totalBills,
        totalRevenue: toNumber(paidAggregate._sum.total),
        pendingPayments: toNumber(pendingAggregate._sum.total),
        pendingCount,
      },
      revenueChart: {
        year,
        labels: MONTHS,
        data: monthly.map((value) => Math.round(value * 100) / 100),
      },
      recentPatients,
      recentTransactions: recentBills.map((bill) => mapBill(bill)),
    };
  }
}
