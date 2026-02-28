import { BaseService } from "@/core/BaseService";
import {
  AccountType,
  JournalEntryStatus,
  JournalEntryType,
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
    // @ts-ignore - The model 'analytics' might not exist in PrismaClient types yet
    return this.prisma.analytics;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async getAllAnalytics(startDate?: string, endDate?: string) {
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }

    const buyerWhere = startDate && endDate ? { createdAt: dateFilter } : {};

    const userWhere = startDate && endDate ? { createdAt: dateFilter } : {};

    const orderWhere = startDate && endDate ? { orderDate: dateFilter } : {};

    // Run counts in parallel 🚀
    const [buyersCount, usersCount, ordersCount] = await Promise.all([
      this.prisma.buyer.count({ where: buyerWhere }),
      this.prisma.user.count({ where: userWhere }),
      this.prisma.order.count({ where: orderWhere }),
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

  // =====================================================
  // DOUBLE ENTRY HELPER
  // =====================================================

  private calculateBalance(lines: { type: JournalEntryType; amount: any }[]) {
    return lines.reduce((total, line) => {
      return line.type === JournalEntryType.DEBIT
        ? total + Number(line.amount)
        : total - Number(line.amount);
    }, 0);
  }

  // =====================================================
  // CASH
  // =====================================================

  private async getCashBalance() {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountHead: {
          type: AccountType.ASSET,
          name: { contains: "cash", mode: "insensitive" },
        },
        journalEntry: {
          status: JournalEntryStatus.POSTED,
        },
      },
      select: { type: true, amount: true },
    });

    return this.calculateBalance(lines);
  }

  // =====================================================
  // BANK
  // =====================================================

  private async getBankBalance() {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        bankId: { not: null },
        journalEntry: {
          status: JournalEntryStatus.POSTED,
        },
      },
      select: { type: true, amount: true },
    });

    return this.calculateBalance(lines);
  }

  // =====================================================
  // RECEIVABLE
  // =====================================================

  private async getReceivable() {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        buyerId: { not: null },
        journalEntry: {
          status: JournalEntryStatus.POSTED,
        },
      },
      select: { type: true, amount: true },
    });

    return this.calculateBalance(lines);
  }

  // =====================================================
  // PAYABLE
  // =====================================================

  private async getPayable() {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        supplierId: { not: null },
        journalEntry: {
          status: JournalEntryStatus.POSTED,
        },
      },
      select: { type: true, amount: true },
    });

    return Math.abs(this.calculateBalance(lines));
  }

  // =====================================================
  // MONTHLY REVENUE
  // =====================================================

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
          status: JournalEntryStatus.POSTED,
          date: { gte: start },
        },
      },
      select: { type: true, amount: true },
    });

    return Math.abs(this.calculateBalance(lines));
  }

  // =====================================================
  // MONTHLY EXPENSE
  // =====================================================

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
          status: JournalEntryStatus.POSTED,
          date: { gte: start },
        },
      },
      select: { type: true, amount: true },
    });

    return this.calculateBalance(lines);
  }

  // =====================================================
  // LOAN OUTSTANDING
  // =====================================================

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

  // =====================================================
  // EMPLOYEE ADVANCE
  // =====================================================

  private async getEmployeeAdvanceOutstanding() {
    const advances = await this.prisma.moiCashBook.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    return advances.reduce((sum, adv) => sum + Number(adv.amount), 0);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
