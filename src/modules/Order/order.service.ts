import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { CreateOrderInput, UpdateOrderInput } from "./order.validation";

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

  private mapInvoiceItemData(item: any, itemType: string) {
    const nestedDataKey =
      itemType === "fabricItem"
        ? "fabricItemData"
        : itemType === "labelItem"
          ? "labelItemData"
          : "cartonItemData";

    const nestedData =
      item[nestedDataKey]?.map((d: any) => ({
        ...d,
        totalAmount: d.totalAmount ?? d.TotalAmount ?? 0,
      })) || [];

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
        acc.totalAmount += Number(item.totalAmount ?? item.TotalAmount ?? 0);
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
        return acc;
      },
      {
        totalcartonQty: 0,
        totalNetWeight: 0,
        totalGrossWeight: 0,
        totalUnitPrice: 0,
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
        acc.totalAmount += Number(item.totalAmount ?? item.TotalAmount ?? 0);
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

  public async create(data: CreateOrderInput, include?: any) {
    return super.create(data, include);
  }

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

  public async updateById(id: string, data: UpdateOrderInput, include?: any) {
    return super.updateById(id, data, include);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
