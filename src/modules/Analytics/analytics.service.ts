import { BaseService } from "@/core/BaseService";
import {
  AccountType,
  JournalEntryStatus,
  JournalEntryType,
  OrderStatus,
  PrismaClient,
} from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateAnalyticsInput,
  UpdateAnalyticsInput,
} from "./analytics.validation";

export class AnalyticsService extends BaseService<
  any,
  CreateAnalyticsInput,
  UpdateAnalyticsInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Analytics", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore
    return this.prisma.analytics;
  }

  public async getAllAnalytics(startDate?: string, endDate?: string) {
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }

    const buyerWhere = startDate && endDate ? { createdAt: dateFilter } : {};
    const userWhere = startDate && endDate ? { createdAt: dateFilter } : {};
    const orderWhere = startDate && endDate ? { orderDate: dateFilter } : {};

    const [buyersCount, usersCount, ordersCount] = await Promise.all([
      this.prisma.buyer.count({ where: { ...buyerWhere, isDeleted: false } }),
      this.prisma.user.count({ where: { ...userWhere, isDeleted: false } }),
      this.prisma.order.count({
        where: {
          ...orderWhere,
          isDeleted: false,
          status: {
            in: [OrderStatus.PENDING, OrderStatus.DRAFT],
          },
        },
      }),
    ]);

    return {
      buyers: buyersCount,
      users: usersCount,
      orders: ordersCount,
    };
  }

  public async getFinancialOverview() {
    const [
      cash,
      bank,
      receivable,
      payable,
      revenue,
      expense,
      loanOutstanding,
      employeeAdvanceOutstanding,
    ] = await Promise.all([
      this.getCashBalance(),
      this.getBankBalance(),
      this.getReceivable(),
      this.getPayable(),
      this.getMonthlyRevenue(),
      this.getMonthlyExpense(),
      this.getLoanOutstanding(),
      this.getEmployeeAdvanceOutstanding(),
    ]);

    const netProfit = revenue - expense;
    const workingCapital = cash + bank + receivable - payable;

    return {
      cash,
      bank,
      receivable,
      payable,
      revenue,
      expense,
      netProfit,
      loanOutstanding,
      employeeAdvanceOutstanding,
      workingCapital,
    };
  }

  public async getRevenueTrend() {
    const months: { month: string; revenue: number; expense: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = start.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });

      const [revLines, expLines] = await Promise.all([
        this.prisma.journalLine.findMany({
          where: {
            accountHead: { type: AccountType.INCOME },
            journalEntry: {
              is: {
                status: JournalEntryStatus.POSTED,
                date: { gte: start, lte: end },
              },
            },
          },
          select: { type: true, amount: true },
        }),
        this.prisma.journalLine.findMany({
          where: {
            accountHead: { type: AccountType.EXPENSE },
            journalEntry: {
              is: {
                status: JournalEntryStatus.POSTED,
                date: { gte: start, lte: end },
              },
            },
          },
          select: { type: true, amount: true },
        }),
      ]);

      months.push({
        month: label,
        revenue: Math.abs(this.calculateBalance(revLines)),
        expense: Math.abs(this.calculateBalance(expLines)),
      });
    }
    return months;
  }

  public async getOrderTrend(startDate?: string, endDate?: string, days = 30) {
    const result: { date: string; orders: number }[] = [];
    let rangeStart: Date;
    let rangeEnd: Date;

    if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    } else {
      rangeEnd = new Date();
      rangeStart = new Date();
      rangeStart.setDate(rangeEnd.getDate() - (days - 1));
    }

    const current = new Date(rangeStart);
    while (current <= rangeEnd) {
      const dayStart = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        0,
        0,
        0,
      );
      const dayEnd = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        23,
        59,
        59,
      );

      const count = await this.prisma.order.count({
        where: { orderDate: { gte: dayStart, lte: dayEnd }, isDeleted: false },
      });

      result.push({
        date: dayStart.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        orders: count,
      });

      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  public async getTopBuyers(limit = 5, startDate?: string, endDate?: string) {
    const buyers = await this.prisma.buyer.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true },
    });

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }
    const hasDateFilter = startDate && endDate;

    const results: { name: string; revenue: number; orders: number }[] = [];

    for (const buyer of buyers) {
      const [lines, orderCount] = await Promise.all([
        this.prisma.journalLine.findMany({
          where: {
            buyerId: buyer.id,
            type: JournalEntryType.DEBIT,
            journalEntry: {
              is: {
                status: JournalEntryStatus.POSTED,
                ...(hasDateFilter ? { date: dateFilter } : {}),
              },
            },
          },
          select: { amount: true },
        }),
        this.prisma.order.count({
          where: {
            buyerId: buyer.id,
            isDeleted: false,
            ...(hasDateFilter ? { orderDate: dateFilter } : {}),
          },
        }),
      ]);

      const revenue = lines.reduce(
        (sum: number, l: any) => sum + Number(l.amount),
        0,
      );
      if (revenue > 0 || orderCount > 0) {
        results.push({ name: buyer.name, revenue, orders: orderCount });
      }
    }

    return results.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  }

  public async getPayableFlow(weeks = 6) {
    const result: { week: string; payable: number }[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const weekLabel = `W${weeks - i}`;

      const apLines = await this.prisma.journalLine.findMany({
        where: {
          supplierId: { not: null },
          type: JournalEntryType.CREDIT,
          journalEntry: {
            is: {
              status: JournalEntryStatus.POSTED,
              date: { gte: weekStart, lte: weekEnd },
            },
          },
        },
        select: { amount: true },
      });

      const payable = apLines.reduce(
        (sum: number, l: any) => sum + Number(l.amount),
        0,
      );
      result.push({ week: weekLabel, payable: Math.round(payable) });
    }
    return result;
  }

  public async getARaging() {
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        buyerId: { not: null },
        status: { in: [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT] },
      },
      include: { lines: { select: { type: true, amount: true } } },
    });

    const buckets = [
      { label: "0–30 days", min: 0, max: 30, amount: 0 },
      { label: "31–60 days", min: 31, max: 60, amount: 0 },
      { label: "61–90 days", min: 61, max: 90, amount: 0 },
      { label: "90+ days", min: 91, max: Infinity, amount: 0 },
    ];

    const now = new Date();
    entries.forEach((entry) => {
      const ageDays = Math.floor(
        (now.getTime() - new Date(entry.createdAt).getTime()) / 86400000,
      );
      const net = entry.lines.reduce(
        (sum, l) =>
          l.type === JournalEntryType.DEBIT
            ? sum + Number(l.amount)
            : sum - Number(l.amount),
        0,
      );
      if (net <= 0) return;
      const bucket = buckets.find((b) => ageDays >= b.min && ageDays <= b.max);
      if (bucket) bucket.amount += net;
    });

    return buckets.map((b) => ({
      label: b.label,
      amount: Math.round(b.amount),
    }));
  }

  public async getAPaging() {
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        supplierId: { not: null },
        status: { in: [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT] },
      },
      include: { lines: { select: { type: true, amount: true } } },
    });

    const buckets = [
      { label: "0–30 days", min: 0, max: 30, amount: 0 },
      { label: "31–60 days", min: 31, max: 60, amount: 0 },
      { label: "61–90 days", min: 61, max: 90, amount: 0 },
      { label: "90+ days", min: 91, max: Infinity, amount: 0 },
    ];

    const now = new Date();
    entries.forEach((entry) => {
      const ageDays = Math.floor(
        (now.getTime() - new Date(entry.createdAt).getTime()) / 86400000,
      );
      const net = entry.lines.reduce(
        (sum: number, l: any) =>
          l.type === JournalEntryType.CREDIT
            ? sum + Number(l.amount)
            : sum - Number(l.amount),
        0,
      );
      if (net <= 0) return;
      const bucket = buckets.find((b) => ageDays >= b.min && ageDays <= b.max);
      if (bucket) bucket.amount += net;
    });

    return buckets.map((b) => ({
      label: b.label,
      amount: Math.round(b.amount),
    }));
  }

  public async getCashFlow(weeks = 6) {
    const result: { week: string; inflow: number; outflow: number }[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const weekLabel = `W${weeks - i}`;

      const [debitLines, creditLines] = await Promise.all([
        this.prisma.journalLine.findMany({
          where: {
            type: JournalEntryType.DEBIT,
            journalEntry: {
              is: {
                status: JournalEntryStatus.POSTED,
                date: { gte: weekStart, lte: weekEnd },
              },
            },
          },
          select: { amount: true },
        }),
        this.prisma.journalLine.findMany({
          where: {
            type: JournalEntryType.CREDIT,
            journalEntry: {
              is: {
                status: JournalEntryStatus.POSTED,
                date: { gte: weekStart, lte: weekEnd },
              },
            },
          },
          select: { amount: true },
        }),
      ]);

      const inflow = debitLines.reduce(
        (sum: number, l: any) => sum + Number(l.amount),
        0,
      );
      const outflow = creditLines.reduce(
        (sum: number, l: any) => sum + Number(l.amount),
        0,
      );

      result.push({
        week: weekLabel,
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
      });
    }
    return result;
  }

  public async getDashboardAlerts() {
    const [pendingOrders, overdueAR] = await Promise.all([
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.PENDING, OrderStatus.DRAFT] },
          isDeleted: false,
        },
      }),
      this.prisma.journalEntry.count({
        where: {
          buyerId: { not: null },
          status: JournalEntryStatus.POSTED,
          createdAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const alerts: {
      type: "warning" | "info";
      text: string;
      cta: string;
      href: string;
    }[] = [];

    if (overdueAR > 0) {
      alerts.push({
        type: "warning",
        text: `${overdueAR} accounts receivable overdue by 30+ days`,
        cta: "View AR",
        href: "/accounting/buyer-ledger",
      });
    }

    if (pendingOrders > 0) {
      alerts.push({
        type: "warning",
        text: `${pendingOrders} order${pendingOrders > 1 ? "s are" : " is"} awaiting approval`,
        cta: "Review Orders",
        href: "/order-management/orders",
      });
    }

    return alerts;
  }

  private calculateBalance(lines: { type: JournalEntryType; amount: any }[]) {
    return lines.reduce((total, line) => {
      return line.type === JournalEntryType.DEBIT
        ? total + Number(line.amount)
        : total - Number(line.amount);
    }, 0);
  }

  private async getCashBalance() {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountHead: {
          type: AccountType.ASSET,
          name: { contains: "cash", mode: "insensitive" },
        },
        journalEntry: {
          is: {
            status: JournalEntryStatus.POSTED,
          },
        },
      },
      select: { type: true, amount: true },
    });
    return this.calculateBalance(lines);
  }

  private async getBankBalance() {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        bankId: { not: null },
        journalEntry: {
          is: {
            status: JournalEntryStatus.POSTED,
          },
        },
      },
      select: { type: true, amount: true },
    });
    return this.calculateBalance(lines);
  }

  private async getReceivable() {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        buyerId: { not: null },
        journalEntry: {
          is: {
            status: JournalEntryStatus.POSTED,
          },
        },
      },
      select: { type: true, amount: true },
    });
    return this.calculateBalance(lines);
  }

  private async getPayable() {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        supplierId: { not: null },
        journalEntry: {
          is: {
            status: JournalEntryStatus.POSTED,
          },
        },
      },
      select: { type: true, amount: true },
    });
    return Math.abs(this.calculateBalance(lines));
  }

  private async getMonthlyRevenue() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountHead: {
          type: AccountType.INCOME,
        },
        journalEntry: {
          is: {
            status: JournalEntryStatus.POSTED,
            date: { gte: start },
          },
        },
      },
      select: { type: true, amount: true },
    });
    return Math.abs(this.calculateBalance(lines));
  }

  private async getMonthlyExpense() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountHead: {
          type: AccountType.EXPENSE,
        },
        journalEntry: {
          is: {
            status: JournalEntryStatus.POSTED,
            date: { gte: start },
          },
        },
      },
      select: { type: true, amount: true },
    });
    return this.calculateBalance(lines);
  }

  private async getLoanOutstanding() {
    const loans = await this.prisma.loan.findMany({
      where: { isDeleted: false },
      include: { repayments: true },
    });

    return loans.reduce((total, loan) => {
      const paid = loan.repayments.reduce(
        (sum, r) => sum + Number(r.principal),
        0,
      );
      return total + (Number(loan.principalAmount) - paid);
    }, 0);
  }

  private async getEmployeeAdvanceOutstanding() {
    const advances = await this.prisma.moiCashBook.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED"] as any },
      },
    });
    return advances.reduce((sum, adv) => sum + Number(adv.amount), 0);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
