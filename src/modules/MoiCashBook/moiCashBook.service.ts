import { BaseService } from "@/core/BaseService";
import { 
  Prisma, 
  PrismaClient, 
  JournalEntryCategory, 
  JournalEntryType,
  AccountType
} from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateMoiCashBookInput,
  UpdateMoiCashBookInput,
} from "./moiCashBook.validation";
import { JournalEntryService } from "../JournalEntry/journalEntry.service";

export class MoiCashBookService extends BaseService<
  any,
  CreateMoiCashBookInput,
  UpdateMoiCashBookInput
> {
  private journalEntryService: JournalEntryService;

  constructor(prisma: PrismaClient) {
    super(prisma, "MoiCashBook", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
    this.journalEntryService = new JournalEntryService(prisma);
  }

  protected getModel() {
    // @ts-ignore - Handled in BaseService for common models, but explicitly defined for safety
    return this.prisma.moiCashBook;
  }

  /**
   * Industry Standard Creation:
   * 1. Creates the Cash Book Record
   * 2. Generates the Journal Entry
   * 3. Links them together
   */
  public async create(data: CreateMoiCashBookInput & { createdById?: string }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Resolve Company Profile (Auto-support for single entity)
      let companyProfileId = data.companyProfileId;
      if (!companyProfileId) {
        const defaultProfile = await tx.companyProfile.findFirst({
          where: { isDeleted: false }
        });
        if (!defaultProfile) throw new Error("No active Company Profile found. Please create one in Company Settings.");
        companyProfileId = defaultProfile.id;
      }

      // 2. Resolve the "Staff Advance" Control Account (Asset)
      let advanceAccountId = data.advanceAccountId;
      if (!advanceAccountId) {
        const staffAdvanceAcc = await tx.accountHead.findFirst({
          where: {
            companyProfileId: companyProfileId,
            name: { contains: "Staff Advance", mode: "insensitive" },
            isDeleted: false
          }
        });
        if (!staffAdvanceAcc) {
          throw new Error("Accounting Error: No 'Staff Advance' control account found. Please create one in Chart of Accounts.");
        }
        advanceAccountId = staffAdvanceAcc.id;
      }

      // 3. Get Employee Info for Narration
      const employee = await tx.user.findUnique({
        where: { id: data.employeeId },
        select: { firstName: true, lastName: true }
      });

      // 4. Prepare Journal Lines
      const lines: any[] = [];
      let category = JournalEntryCategory.JOURNAL;

      if (data.type === "ISSUE") {
        if (!data.cashAccountId) throw new Error("Cash/Bank account is required for issuing funds.");
        category = JournalEntryCategory.PAYMENT;
        lines.push({ accountHeadId: advanceAccountId, type: JournalEntryType.DEBIT, amount: data.amount });
        lines.push({ accountHeadId: data.cashAccountId, type: JournalEntryType.CREDIT, amount: data.amount });
      } 
      else if (data.type === "SETTLE") {
        category = data.expenseAccountId ? JournalEntryCategory.JOURNAL : JournalEntryCategory.RECEIPT;
        lines.push({ accountHeadId: advanceAccountId, type: JournalEntryType.CREDIT, amount: data.amount });
        
        if (data.expenseAccountId) {
          lines.push({ accountHeadId: data.expenseAccountId, type: JournalEntryType.DEBIT, amount: data.amount });
        } else if (data.cashAccountId) {
          lines.push({ accountHeadId: data.cashAccountId, type: JournalEntryType.DEBIT, amount: data.amount });
        }
      } 
      else if (data.type === "EXPENSE") {
        if (!data.cashAccountId || !data.expenseAccountId) throw new Error("Acc counts required for direct expense.");
        category = JournalEntryCategory.PAYMENT;
        lines.push({ accountHeadId: data.expenseAccountId, type: JournalEntryType.DEBIT, amount: data.amount });
        lines.push({ accountHeadId: data.cashAccountId, type: JournalEntryType.CREDIT, amount: data.amount });
      }

      // 5. Create Journal Entry Draft
      const journalData = {
        date: new Date(),
        category,
        narration: `[Cash Book] ${data.purpose} - ${employee?.firstName} ${employee?.lastName}`,
        companyProfileId: companyProfileId,
        createdById: data.createdById,
        lines: lines
      };

      const entry = await this.journalEntryService.createDraft(journalData as any);

      // 6. Create the Cash Book Record
      const result = await tx.moiCashBook.create({
        data: {
          voucherNo: data.voucherNo,
          amount: data.amount,
          purpose: data.purpose,
          employeeId: data.employeeId,
          type: data.type,
          status: data.status || "APPROVED",
          remarks: data.remarks,
          companyProfileId: companyProfileId,
          journalEntryId: entry.id
        }
      });

      if (data.autoPost) {
        await this.journalEntryService.postEntry(entry.id);
      }

      return result;
    });
  }

  public async findMany(
    querys: any = {},
    pagination?: Partial<PaginationOptions>,
  ) {
    const { search, type, status, sortBy = "createdAt", sortOrder = "desc", companyProfileId } = querys;
    
    const filters: Prisma.MoiCashBookWhereInput = {
      ...(companyProfileId && { companyProfileId }),
      ...(type && { type }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { purpose: { contains: search, mode: "insensitive" } },
          { voucherNo: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return super.findMany(filters, pagination, { [sortBy]: sortOrder }, {
      employee: true,
      journalEntry: true
    });
  }

  // RE-EXPOSING PUBLIC WRAPPERS FOR CONTROLLER
  public async findById(id: string, include?: any) {
    return super.findById(id, include || { employee: true, journalEntry: true });
  }

  public async updateById(id: string, data: UpdateMoiCashBookInput) {
    return super.updateById(id, data);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }

  public async getSummaries(companyProfileId?: string) {
    const transactions = await this.prisma.moiCashBook.findMany({
      where: {
        ...(companyProfileId && { companyProfileId }),
        status: { in: ["APPROVED", "SETTLED"] },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });

    const summaryMap: Record<string, any> = {};

    for (const tx of transactions) {
      const empId = tx.employeeId;
      if (!summaryMap[empId]) {
        summaryMap[empId] = {
          id: empId,
          name: `${tx.employee.firstName} ${tx.employee.lastName}`,
          designation: tx.employee.designation,
          totalIssuedAmount: 0,
          totalReturnedAmount: 0,
          outstandingAmount: 0,
          lastTransaction: tx.createdAt,
        };
      }

      const amount = Number(tx.amount);
      if (tx.type === "ISSUE") {
        summaryMap[empId].totalIssuedAmount += amount;
      } else if (tx.type === "SETTLE") {
        summaryMap[empId].totalReturnedAmount += amount;
      }

      if (new Date(tx.createdAt) > new Date(summaryMap[empId].lastTransaction)) {
        summaryMap[empId].lastTransaction = tx.createdAt;
      }
    }

    return Object.values(summaryMap).map((s: any) => ({
      ...s,
      outstandingAmount: s.totalIssuedAmount - s.totalReturnedAmount,
    }));
  }

  public async getEmployeeSummary(employeeId: string) {
    const transactions = await this.prisma.moiCashBook.findMany({
      where: {
        employeeId,
        status: { in: ["APPROVED", "SETTLED"] },
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
    });

    if (transactions.length === 0) {
      const employee = await this.prisma.user.findUnique({
        where: { id: employeeId },
        select: { id: true, firstName: true, lastName: true, designation: true },
      });
      if (!employee) return null;
      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation,
        totalIssuedAmount: 0, totalReturnedAmount: 0, outstandingAmount: 0,
        lastTransaction: null,
      };
    }

    let totalIssuedAmount = 0;
    let totalReturnedAmount = 0;
    let lastTransaction = transactions[0].createdAt;

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.type === "ISSUE") totalIssuedAmount += amount;
      else if (tx.type === "SETTLE") totalReturnedAmount += amount;
      
      if (new Date(tx.createdAt) > new Date(lastTransaction)) {
        lastTransaction = tx.createdAt;
      }
    }

    const emp = transactions[0].employee;
    return {
      id: employeeId,
      name: `${emp.firstName} ${emp.lastName}`,
      designation: emp.designation,
      totalIssuedAmount,
      totalReturnedAmount,
      outstandingAmount: totalIssuedAmount - totalReturnedAmount,
      lastTransaction,
    };
  }

  public async getEmployeeDetail(employeeId: string, pagination: Partial<PaginationOptions> = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.moiCashBook.findMany({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
        include: { employee: true, journalEntry: true },
      }),
      this.prisma.moiCashBook.count({ where: { employeeId } }),
    ]);

    return {
      data, total, page, limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1,
    };
  }
}
