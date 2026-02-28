import { BaseService } from "@/core/BaseService";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateMoiCashBookInput,
  UpdateMoiCashBookInput,
} from "./moiCashBook.validation";

export class MoiCashBookService extends BaseService<
  any,
  CreateMoiCashBookInput,
  UpdateMoiCashBookInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "MoiCashBook", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'moiCashBook' might not exist in PrismaClient types yet
    return this.prisma.moiCashBook;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async create(data: CreateMoiCashBookInput, include?: any) {
    return super.create(data, include);
  }

  public async findMany(
    querys: any = {},
    pagination?: Partial<PaginationOptions>,
    include?: any,
  ) {
    const { search, type, status, page, limit, sortBy, sortOrder } = querys;
    // 3. Define Ordering
    const orderBy = {
      [sortBy]: sortOrder,
    };
    // 1. Build the filter object (where clause)
    const filters: Prisma.MoiCashBookWhereInput = {
      // Filter by Type and Status if provided
      ...(type && { type }),
      ...(status && { status }),

      // Search logic (Filters by purpose OR voucherNo)
      ...(search && {
        OR: [
          { purpose: { contains: search, mode: "insensitive" } },
          { voucherNo: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
    return super.findMany(filters, pagination, orderBy, {
      employee: true,
    });
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, include);
  }

  public async updateById(
    id: string,
    data: UpdateMoiCashBookInput,
    include?: any,
  ) {
    return super.updateById(id, data, include);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async getSummaries() {
    // 1. Get all approved/settled transactions linked to employees
    const transactions = await this.prisma.moiCashBook.findMany({
      where: {
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

    // 2. Aggregate by employeeId
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

      // Update lastTransaction if this one is newer
      if (new Date(tx.createdAt) > new Date(summaryMap[empId].lastTransaction)) {
        summaryMap[empId].lastTransaction = tx.createdAt;
      }
    }

    // 3. Calculate Outstanding and format result
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

    if (transactions.length === 0) {
      // Try to get employee info independently if no transactions exist
      const employee = await this.prisma.user.findUnique({
        where: { id: employeeId },
        select: { id: true, firstName: true, lastName: true, designation: true },
      });
      if (!employee) return null;
      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation,
        totalIssuedAmount: 0,
        totalReturnedAmount: 0,
        outstandingAmount: 0,
        lastTransaction: null,
      };
    }

    let totalIssuedAmount = 0;
    let totalReturnedAmount = 0;
    let lastTransaction = transactions[0].createdAt;

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.type === "ISSUE") {
        totalIssuedAmount += amount;
      } else if (tx.type === "SETTLE") {
        totalReturnedAmount += amount;
      }
      if (new Date(tx.createdAt) > new Date(lastTransaction)) {
        lastTransaction = tx.createdAt;
      }
    }

    const first = transactions[0];
    return {
      id: employeeId,
      name: `${first.employee.firstName} ${first.employee.lastName}`,
      designation: first.employee.designation,
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
        skip,
        take: limit,
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
      }),
      this.prisma.moiCashBook.count({ where: { employeeId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1,
    };
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
