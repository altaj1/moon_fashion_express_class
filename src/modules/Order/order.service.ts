import { BaseService } from "@/core/BaseService";
import {
  OrderStatus,
  Prisma,
  PrismaClient,
  ProductType,
} from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { CreateOrderInput, UpdateOrderInput } from "./order.validation";
import { AppError } from "@/core/errors/AppError";
import { prisma } from "@/lib/prisma";
export class OrderService extends BaseService<
  any,
  CreateOrderInput,
  UpdateOrderInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Order", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'order' might not exist in PrismaClient types yet
    return this.prisma.order;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  private mapOrdeItemData(item: any, itemType: string) {
    const nestedDataKey =
      itemType === "fabricItem"
        ? "fabricItemData"
        : itemType === "labelItem"
          ? "labelItemData"
          : "cartonItemData";

    // Map nested data and calculate per-item totalAmount
    const nestedData =
      item[nestedDataKey]?.map((d: any) => {
        let totalAmount = 0;

        if (itemType === "cartonItem") {
          totalAmount = Number(d.unitPrice ?? 0) * Number(d.cartonQty ?? 0);
        } else if (itemType === "fabricItem") {
          totalAmount = Number(d.unitPrice ?? 0) * Number(d.quantityYds ?? 0);
        } else if (itemType === "labelItem") {
          totalAmount = Number(d.unitPrice ?? 0) * Number(d.quantityPcs ?? 0);
        }

        return {
          ...d,
          totalAmount,
        };
      }) || [];

    let totals = {};

    if (itemType === "labelItem") {
      totals = this.calculateLabelItemTotals(nestedData);
    }

    if (itemType === "fabricItem") {
      totals = this.calculateFabricItemTotals(nestedData);
    }

    if (itemType === "cartonItem") {
      totals = this.calculateCartonItemTotals(nestedData);
    }

    return {
      [itemType]: {
        create: {
          ...item,
          ...totals,
          [nestedDataKey]: {
            createMany: {
              data: nestedData,
            },
          },
        },
      },
    };
  }

  private calculateLabelItemTotals(data: any[]) {
    return data.reduce(
      (acc, item) => {
        acc.netWeightTotal += Number(item.netWeight ?? 0);
        acc.grossWeightTotal += Number(item.grossWeight ?? 0);
        acc.quantityDznTotal += Number(item.quantityDzn ?? 0);
        acc.quantityPcsTotal += Number(item.quantityPcs ?? 0);
        acc.unitPriceTotal += Number(item.unitPrice ?? 0);
        acc.totalAmount += Number(item.totalAmount ?? item.totalAmount ?? 0);
        return acc;
      },
      {
        netWeightTotal: 0,
        grossWeightTotal: 0,
        quantityDznTotal: 0,
        quantityPcsTotal: 0,
        unitPriceTotal: 0,
        totalAmount: 0,
      },
    );
  }
  private calculateCartonItemTotals(data: any[]) {
    return data.reduce(
      (acc, item) => {
        acc.totalcartonQty += Number(item.cartonQty ?? 0);
        acc.totalNetWeight += Number(item.netWeight ?? 0);
        acc.totalGrossWeight += Number(item.grossWeight ?? 0);
        acc.totalUnitPrice += Number(item.unitPrice ?? 0);
        acc.totalAmount += Number(item.totalAmount);
        return acc;
      },
      {
        totalcartonQty: 0,
        totalNetWeight: 0,
        totalGrossWeight: 0,
        totalUnitPrice: 0,
        totalAmount: 0,
      },
    );
  }

  private calculateFabricItemTotals(data: any[]) {
    return data.reduce(
      (acc, item) => {
        acc.totalNetWeight += Number(item.netWeight ?? 0);
        acc.totalGrossWeight += Number(item.grossWeight ?? 0);
        acc.totalQuantityYds += Number(item.quantityYds ?? 0);
        acc.totalUnitPrice += Number(item.unitPrice ?? 0);
        acc.totalAmount += Number(item.totalAmount ?? item.totalAmount ?? 0);
        return acc;
      },
      {
        totalNetWeight: 0,
        totalGrossWeight: 0,
        totalQuantityYds: 0,
        totalUnitPrice: 0,
        totalAmount: 0,
      },
    );
  }

  public async create(
    data: CreateOrderInput,
    userId: string | undefined,
    include?: any,
  ) {
    try {
      const {
        productType,
        orderItems,
        // invoiceTermsId,
        buyerId,
        companyProfileId,
        ...invoiceRest
      } = data;

      if (!orderItems) {
        throw new AppError(400, "Order item is required for creating an order");
      }

      let orderItemCreateData: any = {};

      // Determine which item type exists
      switch (productType) {
        case ProductType.FABRIC:
          orderItemCreateData = this.mapOrdeItemData(
            orderItems?.fabricItem,
            "fabricItem",
          );
          break;

        case ProductType.LABEL_TAG:
          orderItemCreateData = this.mapOrdeItemData(
            orderItems?.labelItem,
            "labelItem",
          );
          break;

        case ProductType.CARTON:
          orderItemCreateData = this.mapOrdeItemData(
            orderItems?.cartonItem,
            "cartonItem",
          );
          break;

        default:
          throw new AppError(400, `Invalid invoice type '${productType}'`);
      }
      console.log(JSON.stringify(orderItemCreateData, null, 2));
      // Build the payload for Prisma
      const prismaData: Prisma.OrderCreateInput = {
        ...invoiceRest,
        productType,
        buyer: { connect: { id: data.buyerId } },
        user: { connect: { id: userId } },
        companyProfile: { connect: { id: companyProfileId } },
        // invoiceTerms: { connect: { id: invoiceTermsId } },
        orderItems: {
          create: [orderItemCreateData],
        },
      };
      console.log("{ prismaData }", JSON.stringify(prismaData, null, 2));

      const result = await prisma.order.create({
        data: prismaData,
      });

      return result;
    } catch (err: any) {
      console.error("Invoice creation failed:", err);

      throw new AppError(
        err.message || "Failed to create invoice",
        err.statusCode || 500,
      );
    }
  }

  public async findMany(query: any = {}, include?: any) {
    console.log({ query });

    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      productType,
      isDeleted,
      isInvoice,
      isLc,
      ...restFilters
    } = query;
    // Build search filters
    let filters: any = { ...restFilters };

    if (search) {
      filters.OR = [
        { piNumber: { contains: search, mode: "insensitive" } },
        { type: { contains: search, mode: "insensitive" } },
        // Add more searchable fields if needed
      ];
    }
    // Status filter
    if (status) {
      filters.status = status;
    }

    if (typeof isDeleted === "boolean") {
      filters.isDeleted = isDeleted;
    }

    // ProductType filter
    if (productType) {
      filters.productType = productType;
    }
    // isInvoice
    if (typeof isInvoice === "boolean") {
      filters.isInvoice = isInvoice;
    }

    // isLc
    if (typeof isLc === "boolean") {
      filters.isLc = isLc;
    }
    const skip = (page - 1) * limit;

    const total = await this.prisma.order.count({ where: filters });
    const data = await this.prisma.order.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },

      //  POPULATE ALL IDS HERE
      include: {
        buyer: true,
        user: true,
        // invoiceTerms: true,
        companyProfile: true,
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
    return super.findById(id, {
      buyer: true,
      user: true,
      // invoiceTerms: true,
      companyProfile: true,
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
    });
  }

  public async updateById(
    id: string,
    data: UpdateOrderInput,
    userId?: string,
    include?: any,
  ) {
    try {
      const {
        productType,
        orderItems,
        buyerId,
        companyProfileId,

        ...invoiceRest
      } = data;
      const prismaData: any = {
        ...invoiceRest,
      };

      // Update buyer relation
      if (buyerId) {
        prismaData.buyer = {
          connect: { id: buyerId },
        };
      }

      // Update invoice items (replace old ones)
      if (companyProfileId) {
        prismaData.companyProfile = {
          connect: { id: companyProfileId },
        };
      }
      if (productType && orderItems) {
        let invoiceItemUpdateData: any;

        switch (productType) {
          case ProductType.FABRIC:
            invoiceItemUpdateData = this.mapOrdeItemData(
              orderItems.fabricItem,
              "fabricItem",
            );
            break;

          case ProductType.LABEL_TAG:
            invoiceItemUpdateData = this.mapOrdeItemData(
              orderItems.labelItem,
              "labelItem",
            );
            break;

          case ProductType.CARTON:
            invoiceItemUpdateData = this.mapOrdeItemData(
              orderItems.cartonItem,
              "cartonItem",
            );
            break;

          default:
            throw new AppError(400, `Invalid order type '${productType}'`);
        }

        prismaData.orderItems = {
          deleteMany: {},
          create: [invoiceItemUpdateData],
        };
      }
      const result = await prisma.order.update({
        where: { id },
        data: prismaData,
        include,
      });
      return result;
    } catch (err: any) {
      console.error("Invoice update failed:", err);

      throw new AppError(
        err.message || "Failed to update invoice",
        err.statusCode || 500,
      );
    }
  }

  public async updateStatus(id: string, status: OrderStatus) {
    return super.updateById(id, { status });
  }

  public async softDeleteOrder(id: string, isDeleted: boolean) {
    return super.updateById(id, {
      isDeleted,
      deletedAt: isDeleted ? new Date() : null,
    });
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
