import { de } from "zod/v4/locales";
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
import { date } from "zod";
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
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      productType,
      dateFrom,
      dateTo,
      deliveryDateFrom,
      deliveryDateTo,
      isDeleted,
      isInvoice,
      isLc,
      ...restFilters
    } = query;
    // Build search filters
    let filters: any = { ...restFilters };

    if (search) {
      filters.OR = [
        { remarks: { contains: search, mode: "insensitive" } },
        { orderNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    // Status filter
    if (status) {
      filters.status = status;
    }

    // ProductType filter
    if (productType) {
      filters.productType = productType;
    }

    // Apply soft-delete and default filters via BaseService
    filters = this.buildWhereClause(filters);

    if (typeof isDeleted === "boolean") {
      filters.isDeleted = isDeleted;
    }
    // isInvoice
    if (typeof isInvoice === "boolean") {
      filters.isInvoice = isInvoice;
    }

    // isLc
    if (typeof isLc === "boolean") {
      filters.isLc = isLc;
    }

    // orderDate filters
    if (dateFrom || dateTo) {
      filters.orderDate = {};

      if (dateFrom) {
        filters.orderDate.gte = new Date(dateFrom as string);
      }

      if (dateTo) {
        const end = new Date(dateTo as string);
        end.setHours(23, 59, 59, 999);
        filters.orderDate.lte = end;
      }
    }

    // deliveryDate filters
    if (deliveryDateFrom || deliveryDateTo) {
      filters.deliveryDate = {};

      if (deliveryDateFrom) {
        filters.deliveryDate.gte = new Date(deliveryDateFrom as string);
      }

      if (deliveryDateTo) {
        filters.deliveryDate.lte = new Date(deliveryDateTo as string);
      }
    }
    const skip = (page - 1) * limit;
    console.log({ filters });
    const total = await this.prisma.order.count({
      where: filters,
    });
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
        invoices: {
          include: {
            lcManagement: true,
          },
        },
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

    // Enrich with total order amount
    const enrichedData = data.map((order: any) => {
      let totalAmount = 0;
      order.orderItems?.forEach((oi: any) => {
        totalAmount += Number(oi.fabricItem?.totalAmount || 0);
        totalAmount += Number(oi.labelItem?.totalAmount || 0);
        totalAmount += Number(oi.cartonItem?.totalAmount || 0);
      });
      return { ...order, totalAmount };
    });

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
      data: enrichedData,
    };
  }
  public async analytics(
    startDate?: string,
    endDate?: string,
    isDeleted: boolean = false,
  ) {
    // Build filter
    const where: any = {
      isDeleted,
    };

    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Pull order dates
    const orders = await this.prisma.order.findMany({
      where,
      select: {
        orderDate: true,
      },
    });

    // Group by date string
    const grouped: Record<string, number> = {};

    orders.forEach((order: any) => {
      const date = order.orderDate.toISOString().split("T")[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    // Convert to array
    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  }

  public async analyticsOrdersStatus(
    startDate?: string,
    endDate?: string,
    isDeleted: boolean = false,
  ) {
    const where: any = {
      isDeleted,
    };

    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get all orders with status
    const orders = await this.prisma.order.findMany({
      where,
      select: {
        status: true,
      },
    });

    // All possible statuses
    const allStatuses = [
      "DRAFT",
      "PENDING",
      "PROCESSING",
      "APPROVED",
      "DELIVERED",
      "CANCELLED",
    ];

    // Initialize counts with 0
    const statusCount: Record<string, number> = {};

    allStatuses.forEach((status) => {
      statusCount[status] = 0;
    });

    // Count actual data
    orders.forEach((order: any) => {
      statusCount[order.status] += 1;
    });

    // Convert to required format
    return allStatuses.map((status) => ({
      [status]: statusCount[status],
    }));
  }
  public async findById(id: string, include?: any) {
    const result = await super.findById(id, {
      buyer: true,
      user: true,
      // invoiceTerms: true,
      companyProfile: true,
      invoices: {
        include: {
          lcManagement: true,
        },
      },
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

    if (result) {
      let totalAmount = 0;
      (result as any).orderItems?.forEach((oi: any) => {
        totalAmount += Number(oi.fabricItem?.totalAmount || 0);
        totalAmount += Number(oi.labelItem?.totalAmount || 0);
        totalAmount += Number(oi.cartonItem?.totalAmount || 0);
      });
      return { ...result, totalAmount };
    }

    return result;
  }

  public async updateOrder(
    id: string,
    data: any,
    userId?: string,
    include?: any,
  ) {
    try {
      const {
        productType,
        orderItems,
        buyerId,
        companyProfileId,
        ...orderRest
      } = data;

      return await this.prisma.$transaction(async (tx) => {
        /** ------------------------
         * 1️⃣ UPDATE ORDER
         * ------------------------ */
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            ...orderRest,
            ...(buyerId && { buyer: { connect: { id: buyerId } } }),
            ...(companyProfileId && {
              companyProfile: { connect: { id: companyProfileId } },
            }),
          },
        });

        if (!orderItems || !productType) return updatedOrder;

        /** ------------------------
         * 2️⃣ DETERMINE ITEM TYPE
         * ------------------------ */
        let item: any;
        let itemType: string;
        let dataKey: string;
        let foreignKey: string;
        let itemTable: any;
        let dataTable: any;

        switch (productType) {
          case ProductType.FABRIC:
            item = orderItems.fabricItem;
            itemType = "fabricItem";
            dataKey = "fabricItemData";
            foreignKey = "fabricItemId";
            itemTable = tx.fabricItem;
            dataTable = tx.fabricItemData;
            break;

          case ProductType.LABEL_TAG:
            item = orderItems.labelItem;
            itemType = "labelItem";
            dataKey = "labelItemData";
            foreignKey = "labelItemId";
            itemTable = tx.labelItem;
            dataTable = tx.labelItemData;
            break;

          case ProductType.CARTON:
            item = orderItems.cartonItem;
            itemType = "cartonItem";
            dataKey = "cartonItemData";
            foreignKey = "cartonItemId";
            itemTable = tx.cartonItem;
            dataTable = tx.cartonItemData;
            break;

          default:
            throw new AppError(400, `Invalid product type '${productType}'`);
        }

        if (!item) return updatedOrder;

        /** ------------------------
         * 3️⃣ PROCESS NESTED DATA
         * (same as create logic)
         * ------------------------ */
        const nestedData =
          item[dataKey]?.map((d: any) => {
            let totalAmount = 0;

            if (itemType === "cartonItem") {
              totalAmount = Number(d.unitPrice ?? 0) * Number(d.cartonQty ?? 0);
            } else if (itemType === "fabricItem") {
              totalAmount =
                Number(d.unitPrice ?? 0) * Number(d.quantityYds ?? 0);
            } else if (itemType === "labelItem") {
              totalAmount =
                Number(d.unitPrice ?? 0) * Number(d.quantityPcs ?? 0);
            }

            return {
              ...d,
              totalAmount,
            };
          }) || [];

        /** ------------------------
         * 4️⃣ CALCULATE TOTALS
         * ------------------------ */
        let totals: any = {};

        if (itemType === "fabricItem") {
          totals = this.calculateFabricItemTotals(nestedData);
        }

        if (itemType === "labelItem") {
          totals = this.calculateLabelItemTotals(nestedData);
        }

        if (itemType === "cartonItem") {
          totals = this.calculateCartonItemTotals(nestedData);
        }

        /** ------------------------
         * 5️⃣ UPDATE MAIN ITEM
         * ------------------------ */
        const { [dataKey]: nestedArray, ...itemWithoutNested } = item;

        await itemTable.update({
          where: { id: item.id },
          data: {
            ...itemWithoutNested,
            ...totals,
          },
        });

        /** ------------------------
         * 6️⃣ SPLIT CREATE / UPDATE
         * ------------------------ */
        const createRows = nestedData.filter((d: any) => !d.id);
        const updateRows = nestedData.filter((d: any) => d.id);

        /** ------------------------
         * 7️⃣ FIND EXISTING ROWS
         * ------------------------ */
        const existing = await dataTable.findMany({
          where: { [foreignKey]: item.id },
          select: { id: true },
        });

        const existingIds = existing.map((e: any) => e.id);
        const incomingIds = updateRows.map((i: any) => i.id);

        const deleteIds = existingIds.filter(
          (id: string) => !incomingIds.includes(id),
        );

        /** ------------------------
         * 8️⃣ DELETE REMOVED ROWS
         * ------------------------ */
        if (deleteIds.length) {
          await dataTable.deleteMany({
            where: { id: { in: deleteIds } },
          });
        }

        /** ------------------------
         * 9️⃣ CREATE NEW ROWS
         * ------------------------ */
        if (createRows.length) {
          await dataTable.createMany({
            data: createRows.map((r: any) => ({
              ...r,
              [foreignKey]: item.id,
            })),
          });
        }

        /** ------------------------
         * 🔟 UPDATE ROWS
         * ------------------------ */
        for (const row of updateRows) {
          await dataTable.update({
            where: { id: row.id },
            data: row,
          });
        }

        /** ------------------------
         * RETURN UPDATED ORDER
         * ------------------------ */
        return tx.order.findUnique({
          where: { id },
          include: {
            buyer: true,
            user: true,
            companyProfile: true,
            orderItems: {
              include: {
                fabricItem: { include: { fabricItemData: true } },
                labelItem: { include: { labelItemData: true } },
                cartonItem: { include: { cartonItemData: true } },
              },
            },
          },
        });
      });
    } catch (err: any) {
      console.error("Order update failed:", err);

      throw new AppError(
        err.message || "Failed to update order",
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
