import { BaseService } from "@/core/BaseService";
import {
  PrismaClient,
  AccountType,
  JournalEntryStatus,
  JournalEntryType,
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
  // Create Journal Entry (DRAFT)
  // =========================================================================
  public async createDraft(data: CreateJournalEntryInput) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          voucherNo: data.voucherNo,
          date: data.date,
          category: data.category,
          narration: data.narration,
          buyerId: data.buyerId,
          supplierId: data.supplierId,
          companyProfileId: data.companyProfileId,
          createdById: data.createdById,
          status: JournalEntryStatus.DRAFT,
          lines: {
            create: data.lines.map((line) => ({
              accountHeadId: line.accountHeadId,
              type: line.type, // DEBIT | CREDIT
              amount: line.amount,
              buyerId: data.buyerId,
              supplierId: data.supplierId,
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
    return super.updateById(id, data);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }
}
