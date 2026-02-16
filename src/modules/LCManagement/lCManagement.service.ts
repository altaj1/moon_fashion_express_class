import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateLCManagementInput,
  UpdateLCManagementInput,
} from "./lCManagement.validation";
import { th } from "zod/v4/locales";

export class LCManagementService extends BaseService<
  any,
  CreateLCManagementInput,
  UpdateLCManagementInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "LCManagement", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'lCManagement' might not exist in PrismaClient types yet
    return this.prisma.lCManagement;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async create(
    data: CreateLCManagementInput,
    userId: string | undefined,
  ) {
    // 1️⃣ Find invoice by ID
    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id: data.invoiceId,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }
    // 2️⃣ Update related order (set isLc = true)
    await this.prisma.order.update({
      where: {
        id: invoice.orderId,
      },
      data: {
        isLc: true,
      },
    });

    return super.create({
      userId,
      ...data,
    });
  }

  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
  ) {
    return super.findMany(filters, pagination, orderBy, {
      user: true,
      invoice: {
        include: {
          user: true,
          order: {
            include: {
              orderItems: {
                include: {
                  fabricItem: {
                    include: { fabricItemData: true },
                  },
                  labelItem: {
                    include: { labelItemData: true },
                  },
                  cartonItem: {
                    include: { cartonItemData: true },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  public async findById(id: string) {
    return super.findById(id, {
      user: true,
      invoice: {
        include: {
          user: true,
          order: {
            include: {
              orderItems: {
                include: {
                  fabricItem: {
                    include: {
                      fabricItemData: true,
                    },
                  },
                  labelItem: {
                    include: {
                      labelItemData: true,
                    },
                  },
                  cartonItem: {
                    include: {
                      cartonItemData: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  public async updateById(
    id: string,
    data: UpdateLCManagementInput,
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
