import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import {
  CreateSupplierInput,
  UpdateSupplierInput,
  ListSupplierQueryDto,
} from "./supplier.validation";

export class SupplierService extends BaseService<
  any,
  CreateSupplierInput,
  UpdateSupplierInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Supplier", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore
    return this.prisma.supplier;
  }

  // =========================================================================
  // Public API
  // =========================================================================

  public async create(data: CreateSupplierInput, include?: any) {
    return super.create(data, include);
  }

  // =========================================================
  // GET ALL SUPPLIERS (Search + Pagination + Sort)
  // =========================================================
  public async getSuppliers(query: ListSupplierQueryDto) {
    const {
      page,
      limit,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      ...rest
    } = query;

    let filters: any = {};

    // 🔎 SEARCH LOGIC
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    // Merge additional filters (like isDeleted)
    filters = {
      ...filters,
      ...rest,
    };

    const skip = (page - 1) * limit;

    const total = await this.prisma.supplier.count({
      where: filters,
    });

    const data = await this.prisma.supplier.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
      data,
    };
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, include);
  }

  public async updateById(
    id: string,
    data: UpdateSupplierInput,
    include?: any,
  ) {
    return super.updateById(id, data, include);
  }

  // ❌ Don't use hard delete if soft delete enabled
  // public async deleteById(id: string) {
  //   return super.deleteById(id);
  // }

  // ✅ Soft Delete
  public async softDelete(data: any): Promise<any> {
    const { id, isDeleted } = data;

    return super.updateById(id, {
      isDeleted,
      deletedAt: isDeleted ? new Date() : null,
    });
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
