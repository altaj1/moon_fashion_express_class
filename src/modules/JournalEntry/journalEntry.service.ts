import { BaseService } from "@/core/BaseService";
import {
  PrismaClient,
  AccountType,
  JournalEntryStatus,
  JournalEntryType,
  JournalEntryCategory,
} from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "./journalEntry.validation";

export class JournalEntryService extends BaseService<
  any,
  CreateJournalEntryInput,
  UpdateJournalEntryInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "JournalEntry", {
      enableSoftDelete: false,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    return this.prisma.journalEntry;
  }

  // =========================================================================
  // Generate Auto-Voucher Number
  // =========================================================================
  private async generateVoucherNo(category: string, date: Date): Promise<string> {
    const year = date.getFullYear();

    // Map category to a 2-letter prefix
    const prefixMap: Record<string, string> = {
      BUYER_DUE: "BD",
      SUPPLIER_DUE: "SD",
      RECEIPT: "RV",
      PAYMENT: "PV",
      CONTRA: "CV",
      JOURNAL: "JV"
    };

    const prefix = prefixMap[category] || "JV";

    // Find the last entry for this category and year
    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: {
        category: category as any,
        date: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`)
        },
        voucherNo: {
          startsWith: `${prefix}-${year}-`
        }
      },
      orderBy: {
        voucherNo: 'desc'
      }
    });

    let sequence = 1;
    if (lastEntry && lastEntry.voucherNo) {
      // Extract the sequence number from the end (e.g., "PV-2026-0001" -> 1)
      const parts = lastEntry.voucherNo.split('-');
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }

    // Format as PR-YYYY-000X
    return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  // =========================================================================
  // Create Journal Entry (DRAFT)
  // =========================================================================
  public async createDraft(data: CreateJournalEntryInput) {
    const voucherNo = data.voucherNo || await this.generateVoucherNo(data.category, new Date(data.date));

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          voucherNo: voucherNo,
          date: new Date(data.date),
          category: data.category as JournalEntryCategory,
          narration: data.narration,
          buyerId: data.buyerId,
          supplierId: data.supplierId,
          companyProfileId: data.companyProfileId,
          createdById: data.createdById,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          status: JournalEntryStatus.DRAFT,
          lines: {
            create: data.lines.map((line) => ({
              accountHeadId: line.accountHeadId,
              type: line.type, // DEBIT | CREDIT
              amount: line.amount,
              buyerId: data.buyerId,
              supplierId: data.supplierId,
              bankId: line.bankId,
            })),
          },
        },
        include: { lines: true },
      });

      return entry;
    });
  }

  // =========================================================================
  // POST Journal Entry (Main Accounting Engine 🔥)
  // =========================================================================
  public async postEntry(journalEntryId: string) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.findUnique({
        where: { id: journalEntryId },
        include: {
          lines: {
            include: { accountHead: true },
          },
        },
      });

      if (!entry) throw new Error("Journal entry not found");
      if (entry.status === JournalEntryStatus.POSTED)
        throw new Error("Entry already posted");

      // ===============================
      // Debit / Credit Validation
      // ===============================
      let totalDebit = 0;
      let totalCredit = 0;

      for (const line of entry.lines) {
        if (line.type === JournalEntryType.DEBIT) {
          totalDebit += Number(line.amount);
        } else {
          totalCredit += Number(line.amount);
        }
      }

      if (totalDebit !== totalCredit) {
        throw new Error("Debit and Credit amounts must be equal");
      }

      // ===============================
      // Update Account Balances
      // ===============================
      for (const line of entry.lines) {
        const acc = line.accountHead;
        const amount = Number(line.amount);

        let newBalance = Number(acc.openingBalance ?? 0);

        switch (acc.type) {
          case AccountType.ASSET:
          case AccountType.EXPENSE:
            newBalance += line.type === "DEBIT" ? amount : -amount;
            break;

          case AccountType.LIABILITY:
          case AccountType.EQUITY:
          case AccountType.INCOME:
            newBalance += line.type === "CREDIT" ? amount : -amount;
            break;
        }

        await tx.accountHead.update({
          where: { id: acc.id },
          data: { openingBalance: newBalance },
        });
      }

      // ===============================
      // Mark Entry as POSTED
      // ===============================
      await tx.journalEntry.update({
        where: { id: journalEntryId },
        data: { status: JournalEntryStatus.POSTED },
      });

      return { message: "Journal entry posted successfully" };
    });
  }

  // =========================================================================
  // Reverse Journal Entry
  // =========================================================================
  public async reverseEntry(journalEntryId: string) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.journalEntry.findUnique({
        where: { id: journalEntryId },
        include: { lines: true },
      });

      if (!original) throw new Error("Original entry not found");

      const reversed = await tx.journalEntry.create({
        data: {
          voucherNo: `REV-${original.voucherNo}`,
          date: new Date(),
          category: original.category,
          narration: `Reversal of ${original.voucherNo}`,
          reversesId: original.id,
          companyProfileId: original.companyProfileId,
          lines: {
            create: original.lines.map((line) => ({
              accountHeadId: line.accountHeadId,
              type: line.type === "DEBIT" ? "CREDIT" : "DEBIT",
              amount: line.amount,
              buyerId: line.buyerId,
              supplierId: line.supplierId,
              bankId: line.bankId,
            })),
          },
        },
      });

      return reversed;
    });
  }

  // =========================================================================
  // Read APIs (Expose BaseService)
  // =========================================================================
  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
    include?: any,
  ) {
    return super.findMany(filters, pagination, orderBy, include);
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, include);
  }

  public async updateById(id: string, data: UpdateJournalEntryInput) {
    const updateData: any = { ...data };

    if (data.date) {
      updateData.date = new Date(data.date);
    }
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    return super.updateById(id, updateData);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }
}
