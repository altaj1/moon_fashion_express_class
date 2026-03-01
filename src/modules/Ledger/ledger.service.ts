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
        status: { in: [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT] },
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
            status: { in: [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT] },
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
            lines: {
              include: {
                accountHead: { select: { name: true } },
              },
            },
          },
        },
        accountHead: {
          select: { name: true, type: true },
        },
      },
    });

    // 3. Compute running balance, grouped by journal entry to show single row per transaction
    let runningBalance = openingBalance;
    const groupedData: Record<string, any> = {};

    lines.forEach((line) => {
      const isDebit = line.type === "DEBIT";
      const amount = Number(line.amount);

      if (!groupedData[line.journalEntryId]) {
        // Find the "primary" account for this transaction. 
        // For a buyer, we typically want to see the account that balances the AR (e.g. Sales, Cash)
        // We find the line that is NOT the AR line if possible.
        // As a simplification, we'll try to find the non-receivable line, or just take the first line.
        const otherLine = line.journalEntry.lines.find(l => l.id !== line.id) || line.journalEntry.lines[0];

        groupedData[line.journalEntryId] = {
          id: line.journalEntryId,
          date: line.journalEntry.date,
          voucherNo: line.journalEntry.voucherNo,
          category: line.journalEntry.category,
          narration: line.journalEntry.narration,
          accountName: line.journalEntry.lines.length > 2 ? "Multiple Accounts" : (otherLine?.accountHead?.name || "N/A"),
          debitedAccountName: line.journalEntry.lines.length > 2 ? "Multiple Accounts" : (otherLine?.accountHead?.name || "N/A"),
          debit: 0,
          credit: 0,
          balance: 0, // will set later
        };
      }

      if (isDebit) {
        groupedData[line.journalEntryId].debit += amount;
        runningBalance += amount;
      } else {
        groupedData[line.journalEntryId].credit += amount;
        runningBalance -= amount;
      }
      groupedData[line.journalEntryId].balance = runningBalance;
    });

    const data = Object.values(groupedData);

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
        status: { in: [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT] },
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
            status: { in: [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT] },
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
            lines: {
              include: {
                accountHead: { select: { name: true } },
              },
            },
          },
        },
        accountHead: {
          select: { name: true, type: true },
        },
      },
    });

    let runningBalance = openingBalance;
    const groupedData: Record<string, any> = {};

    lines.forEach((line) => {
      const isCredit = line.type === "CREDIT";
      const amount = Number(line.amount);

      if (!groupedData[line.journalEntryId]) {
        const otherLine = line.journalEntry.lines.find(l => l.id !== line.id) || line.journalEntry.lines[0];

        groupedData[line.journalEntryId] = {
          id: line.journalEntryId,
          date: line.journalEntry.date,
          voucherNo: line.journalEntry.voucherNo,
          category: line.journalEntry.category,
          narration: line.journalEntry.narration,
          accountName: line.journalEntry.lines.length > 2 ? "Multiple Accounts" : (otherLine?.accountHead?.name || "N/A"),
          debitedAccountName: line.journalEntry.lines.length > 2 ? "Multiple Accounts" : (otherLine?.accountHead?.name || "N/A"),
          debit: 0,
          credit: 0,
          balance: 0, // will set later
        };
      }

      if (isCredit) {
        groupedData[line.journalEntryId].credit += amount;
        runningBalance += amount;
      } else {
        groupedData[line.journalEntryId].debit += amount;
        runningBalance -= amount;
      }

      groupedData[line.journalEntryId].balance = runningBalance;
    });

    const data = Object.values(groupedData);

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

    // 3. Total Staff Advances (Receivables from employees)
    const staffAdvanceLines = await this.prisma.moiCashBook.findMany({
      where: { status: { in: ["APPROVED", "SETTLED"] } },
      select: { type: true, amount: true },
    });

    const totalStaffAdvances = staffAdvanceLines.reduce((acc, line) => {
      const amount = Number(line.amount);
      return acc + (line.type === "ISSUE" ? amount : -amount);
    }, 0);

    // 4. Cash & Bank Balance
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
      totalStaffAdvances,
      cashAndBankBalance,
      totalAssets: cashAndBankBalance + totalReceivables + totalStaffAdvances,
      totalLiabilities: totalPayables,
    };
  }

  /**
   * Get balances for all buyers
   * Strategy: Query JournalEntry (which has buyerId) → include lines → aggregate
   */
  public async getBuyerBalances() {
    const buyers = await this.prisma.buyer.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, phone: true, location: true },
    });

    // Query through JournalEntry (guaranteed to have buyerId set)
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        buyerId: { not: null },
        status: { in: [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT] },
      },
      include: {
        lines: {
          select: { type: true, amount: true },
        },
      },
    });

    console.log(`[LedgerService] getBuyerBalances: found ${entries.length} journal entries with buyerId`);

    // Group by buyer
    const summaryMap: Record<string, { totalInvoiced: number; totalReceived: number; balance: number }> = {};

    entries.forEach((entry) => {
      const bid = String(entry.buyerId);

      if (!summaryMap[bid]) {
        summaryMap[bid] = { totalInvoiced: 0, totalReceived: 0, balance: 0 };
      }

      entry.lines.forEach((line) => {
        const amt = Number(line.amount);
        if (line.type === "DEBIT") {
          summaryMap[bid].totalInvoiced += amt;
          summaryMap[bid].balance += amt;
        } else {
          summaryMap[bid].totalReceived += amt;
          summaryMap[bid].balance -= amt;
        }
      });
    });

    return buyers.map((b) => {
      const bid = String(b.id);
      const summary = summaryMap[bid] || { totalInvoiced: 0, totalReceived: 0, balance: 0 };

      return {
        ...b,
        totalInvoiced: summary.totalInvoiced,
        totalReceived: summary.totalReceived,
        balance: summary.balance,
      };
    });
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
        journalEntry: { status: { in: [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT] } },
        supplierId: { not: null },
      },
      include: {
        journalEntry: {
          select: { status: true }
        }
      }
    });

    console.log(`[LedgerService] Found ${lines.length} journal lines for supplier summary`);

    // Group by supplier
    const summaryMap: Record<string, { totalBilled: number; totalPaid: number; balance: number }> = {};

    lines.forEach((l) => {
      const sid = String(l.supplierId);
      const amt = Number(l.amount);

      if (!summaryMap[sid]) {
        summaryMap[sid] = { totalBilled: 0, totalPaid: 0, balance: 0 };
      }

      if (l.type === "CREDIT") {
        summaryMap[sid].totalBilled += amt;
        summaryMap[sid].balance += amt;
      } else {
        summaryMap[sid].totalPaid += amt;
        summaryMap[sid].balance -= amt;
      }
    });

    return suppliers.map((s) => {
      const sid = String(s.id);
      const summary = summaryMap[sid] || { totalBilled: 0, totalPaid: 0, balance: 0 };

      return {
        ...s,
        totalBilled: summary.totalBilled,
        totalPaid: summary.totalPaid,
        balance: summary.balance,
      };
    });
  }
}
