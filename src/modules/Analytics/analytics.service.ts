import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
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

  public async create(data: CreateAnalyticsInput, include?: any) {
    return super.create(data, include);
  }

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
  public async findById(id: string, include?: any) {
    return super.findById(id, include);
  }

  public async updateById(
    id: string,
    data: UpdateAnalyticsInput,
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
