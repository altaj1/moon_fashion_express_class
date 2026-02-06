import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateBuyerInput,
  ListBuyerQueryDto,
  UpdateBuyerInput,
} from "./buyer.validation";

export class BuyerService extends BaseService<
  any,
  CreateBuyerInput,
  UpdateBuyerInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Buyer", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'buyer' might not exist in PrismaClient types yet
    return this.prisma.buyer;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async create(data: CreateBuyerInput, include?: any) {
    return super.create(data, include);
  }

  async getBuyers(query: ListBuyerQueryDto) {
    const {
      page,
      limit,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      ...rest
    } = query;

    // SEARCH LOGIC
    let filters: any = {};

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { merchandiser: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    // ADD OTHER FILTERS (if you add later)
    filters = {
      ...filters,
      ...rest,
    };

    // PAGINATION CALC
    const skip = (page - 1) * limit;

    // COUNT TOTAL
    const total = await this.prisma.buyer.count({
      where: filters,
    });

    // GET DATA
    const data = await this.prisma.buyer.findMany({
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

  public async updateById(id: string, data: UpdateBuyerInput, include?: any) {
    return super.updateById(id, data, include);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

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
