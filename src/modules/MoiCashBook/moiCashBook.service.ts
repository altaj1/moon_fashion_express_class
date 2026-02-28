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

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
