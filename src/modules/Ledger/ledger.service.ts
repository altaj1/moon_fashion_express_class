import { PrismaClient, JournalEntryStatus } from "@/generated/prisma/client";
import { LedgerListQueryDto, GeneralLedgerQueryDto } from "./ledger.validation";

export class LedgerService {
  constructor(private prisma: PrismaClient) { }

  // =========================================================================
  // Buyer Ledger (Computed from JournalLines)
  // =========================================================================
  public async getBuyerLedger(buyerId: string, query: LedgerListQueryDto) {
    const { page, limit, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    // Base filter: only POSTED entries for this specific buyer
    const baseWhere: any = {
      buyerId: buyerId,
      journalEntry: {
        status: JournalEntryStatus.POSTED,
      },
    };

    // Date range filter
    if (startDate || endDate) {
      baseWhere.journalEntry.date = {};
      if (startDate) baseWhere.journalEntry.date.gte = new Date(startDate);
      if (endDate) baseWhere.journalEntry.date.lte = new Date(endDate);
    }

    // 1. Get opening balance (sum of all transactions BEFORE the start date)
    let openingBalance = 0;
    if (startDate) {
      const priorLines = await this.prisma.journalLine.findMany({
        where: {
          buyerId: buyerId,
          journalEntry: {
            status: JournalEntryStatus.POSTED,
            date: { lt: new Date(startDate) },
          },
        },
      });

      // Buyer is an ASSET. Debit increases balance (due), Credit decreases balance (paid).
      openingBalance = priorLines.reduce((acc, line) => {
        const amount = Number(line.amount);
        return acc + (line.type === "DEBIT" ? amount : -amount);
      }, 0);
    }

    // 2. Get paginated transactions within the period
    const totalLines = await this.prisma.journalLine.count({
      where: baseWhere,
    });

    const lines = await this.prisma.journalLine.findMany({
      where: baseWhere,
      skip,
      take: limit,
      orderBy: {
        journalEntry: {
          date: "asc",
        },
      },
      include: {
        journalEntry: {
          select: {
            voucherNo: true,
            date: true,
            category: true,
            narration: true,
          },
        },
        accountHead: {
          select: { name: true, type: true },
        },
      },
    });

    // 3. Compute running balance
    let runningBalance = openingBalance;
    const data = lines.map((line) => {
      const amount = Number(line.amount);
      const isDebit = line.type === "DEBIT";

      runningBalance += isDebit ? amount : -amount;

      return {
        id: line.id,
        date: line.journalEntry.date,
        voucherNo: line.journalEntry.voucherNo,
        category: line.journalEntry.category,
        narration: line.journalEntry.narration,
        accountName: line.accountHead.name,
        debit: isDebit ? amount : 0,
        credit: !isDebit ? amount : 0,
        balance: runningBalance,
      };
    });

    return {
      openingBalance,
      closingBalance: runningBalance,
      page,
      limit,
      total: totalLines,
      totalPages: Math.ceil(totalLines / limit),
      hasNext: page * limit < totalLines,
      hasPrevious: page > 1,
      data,
    };
  }

  // =========================================================================
  // Supplier Ledger (Computed from JournalLines)
  // =========================================================================
  public async getSupplierLedger(
    supplierId: string,
    query: LedgerListQueryDto,
  ) {
    const { page, limit, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const baseWhere: any = {
      supplierId: supplierId,
      journalEntry: {
        status: JournalEntryStatus.POSTED,
      },
    };

    if (startDate || endDate) {
      baseWhere.journalEntry.date = {};
      if (startDate) baseWhere.journalEntry.date.gte = new Date(startDate);
      if (endDate) baseWhere.journalEntry.date.lte = new Date(endDate);
    }

    let openingBalance = 0;
    if (startDate) {
      const priorLines = await this.prisma.journalLine.findMany({
        where: {
          supplierId: supplierId,
          journalEntry: {
            status: JournalEntryStatus.POSTED,
            date: { lt: new Date(startDate) },
          },
        },
      });

      // Supplier is a LIABILITY. Credit increases balance (due), Debit decreases balance (paid).
      openingBalance = priorLines.reduce((acc, line) => {
        const amount = Number(line.amount);
        return acc + (line.type === "CREDIT" ? amount : -amount);
      }, 0);
    }

    const totalLines = await this.prisma.journalLine.count({
      where: baseWhere,
    });

    const lines = await this.prisma.journalLine.findMany({
      where: baseWhere,
      skip,
      take: limit,
      orderBy: {
        journalEntry: {
          date: "asc",
        },
      },
      include: {
        journalEntry: {
          select: {
            voucherNo: true,
            date: true,
            category: true,
            narration: true,
          },
        },
        accountHead: {
          select: { name: true, type: true },
        },
      },
    });

    let runningBalance = openingBalance;
    const data = lines.map((line) => {
      const amount = Number(line.amount);
      const isCredit = line.type === "CREDIT";

      runningBalance += isCredit ? amount : -amount;

      return {
        id: line.id,
        date: line.journalEntry.date,
        voucherNo: line.journalEntry.voucherNo,
        category: line.journalEntry.category,
        narration: line.journalEntry.narration,
        accountName: line.accountHead.name,
        debit: !isCredit ? amount : 0,
        credit: isCredit ? amount : 0,
        balance: runningBalance,
      };
    });

    return {
      openingBalance,
      closingBalance: runningBalance,
      page,
      limit,
      total: totalLines,
      totalPages: Math.ceil(totalLines / limit),
      hasNext: page * limit < totalLines,
      hasPrevious: page > 1,
      data,
    };
  }

  /**
   * Get Audit Trail (Recent Entries)
   */
  public async getAuditTrail(query: any = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }
    if (query.category) where.category = query.category;

    const [total, data] = await Promise.all([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        take: limit,
        skip,
        orderBy: { date: "desc" },
        include: {
          createdBy: { select: { firstName: true, lastName: true, email: true } },
          buyer: { select: { name: true } },
          supplier: { select: { name: true } },
          lines: { include: { accountHead: { select: { name: true } } } },
        },
      }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  /**
   * Get Dashboard Stats (High-level accounting overview)
   */
  public async getDashboardStats() {
    // 1. Total Buyer Dues (Receivables)
    const buyerLines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: { status: JournalEntryStatus.POSTED },
        buyerId: { not: null },
      },
      select: { type: true, amount: true },
    });

    const totalReceivables = buyerLines.reduce((acc, line) => {
      const amount = Number(line.amount);
      return acc + (line.type === "DEBIT" ? amount : -amount);
    }, 0);

    // 2. Total Supplier Dues (Payables)
    const supplierLines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: { status: JournalEntryStatus.POSTED },
        supplierId: { not: null },
      },
      select: { type: true, amount: true },
    });

    const totalPayables = supplierLines.reduce((acc, line) => {
      const amount = Number(line.amount);
      return acc + (line.type === "CREDIT" ? amount : -amount);
    }, 0);

    // 3. Cash & Bank Balance
    const assetAccounts = await this.prisma.accountHead.findMany({
      where: {
        type: "ASSET",
        OR: [
          { name: { contains: "Cash", mode: "insensitive" } },
          { name: { contains: "Bank", mode: "insensitive" } },
        ],
      },
      include: {
        journalLines: {
          where: { journalEntry: { status: JournalEntryStatus.POSTED } },
          select: { type: true, amount: true },
        },
      },
    });

    let cashAndBankBalance = 0;
    assetAccounts.forEach((acc) => {
      const opening = Number(acc.openingBalance || 0);
      const activity = acc.journalLines.reduce((sum, line) => {
        const amount = Number(line.amount);
        return sum + (line.type === "DEBIT" ? amount : -amount);
      }, 0);
      cashAndBankBalance += opening + activity;
    });

    return {
      totalReceivables,
      totalPayables,
      cashAndBankBalance,
      totalAssets: cashAndBankBalance + totalReceivables,
      totalLiabilities: totalPayables,
    };
  }

  /**
   * Get balances for all buyers
   */
  public async getBuyerBalances() {
    const buyers = await this.prisma.buyer.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, phone: true, location: true },
    });

    const lines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: { status: JournalEntryStatus.POSTED },
        buyerId: { not: null },
      },
      select: { buyerId: true, type: true, amount: true },
    });

    // Group by buyer
    const balanceMap: Record<string, number> = {};
    lines.forEach((l) => {
      const bid = l.buyerId!;
      const amt = Number(l.amount);
      const delta = l.type === "DEBIT" ? amt : -amt;
      balanceMap[bid] = (balanceMap[bid] || 0) + delta;
    });

    return buyers.map((b) => ({
      ...b,
      balance: balanceMap[b.id] || 0,
    }));
  }

  /**
   * Get balances for all suppliers
   */
  public async getSupplierBalances() {
    const suppliers = await this.prisma.supplier.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, phone: true, location: true },
    });

    const lines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: { status: JournalEntryStatus.POSTED },
        supplierId: { not: null },
      },
      select: { supplierId: true, type: true, amount: true },
    });

    // Group by supplier
    const balanceMap: Record<string, number> = {};
    lines.forEach((l) => {
      const sid = l.supplierId!;
      const amt = Number(l.amount);
      const delta = l.type === "CREDIT" ? amt : -amt; // Liability: Credit increases balance
      balanceMap[sid] = (balanceMap[sid] || 0) + delta;
    });

    return suppliers.map((s) => ({
      ...s,
      balance: balanceMap[s.id] || 0,
    }));
  }
}
