import { BaseService } from "@/core/BaseService";
import { prisma } from "@/lib/prisma";
import { PrismaClient, InvoiceType } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { CreateInvoiceInput, UpdateInvoiceInput } from "./invoice.validation";
import { AppError } from "@/core/errors/AppError";

export class InvoiceService extends BaseService<
  any,
  CreateInvoiceInput,
  UpdateInvoiceInput
> {
  constructor() {
    super(prisma, "Invoice", {
      enableSoftDelete: false,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'invoice' might not exist in PrismaClient types yet
    return prisma.invoice;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
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
          ...totals, // ✅ totals injected BEFORE DB insert
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

  public async create(
    data: CreateInvoiceInput,
    userId: string | undefined,
    include?: any,
  ) {
    try {
      const {
        type,
        invoiceItem,
        invoiceTermsId,
        buyerId,

        ...invoiceRest
      } = data;

      if (!invoiceItem) {
        throw new AppError(
          400,
          "Invoice item is required for creating an invoice",
        );
      }

      let invoiceItemCreateData: any = {};

      // Determine which item type exists
      switch (type) {
        case InvoiceType.FABRIC:
          invoiceItemCreateData = this.mapInvoiceItemData(
            invoiceItem?.fabricItem,
            "fabricItem",
          );
          break;

        case InvoiceType.LABEL_TAG:
          invoiceItemCreateData = this.mapInvoiceItemData(
            invoiceItem?.labelItem,
            "labelItem",
          );
          break;

        case InvoiceType.CARTON:
          invoiceItemCreateData = this.mapInvoiceItemData(
            invoiceItem?.cartonItem,
            "cartonItem",
          );
          break;

        default:
          throw new AppError(400, `Invalid invoice type '${type}'`);
      }
      console.log(JSON.stringify(invoiceItemCreateData, null, 2));
      // Build the payload for Prisma
      const prismaData: any = {
        ...invoiceRest,
        type,
        buyer: { connect: { id: data.buyerId } },
        user: { connect: { id: userId } },
        invoiceTerms: { connect: { id: invoiceTermsId } },
        invoiceItems: {
          create: [invoiceItemCreateData],
        },
      };
      console.log("{ prismaData }", JSON.stringify(prismaData, null, 2));

      const result = await prisma.invoice.create({
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

    const skip = (page - 1) * limit;

    const total = await this.prisma.invoice.count({ where: filters });
    const data = await this.prisma.invoice.findMany({
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
        invoiceTerms: true,

        invoiceItems: {
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
      invoiceTerms: true,

      invoiceItems: {
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
    data: UpdateInvoiceInput,
    userId?: string,
    include?: any,
  ) {
    try {
      const { type, invoiceItem, buyerId, invoiceTermsId, ...invoiceRest } =
        data;

      const prismaData: any = {
        ...invoiceRest,
      };

      // Update type if provided
      if (type) {
        prismaData.type = type;
      }

      // Update buyer relation
      // if (buyerId) {
      //   prismaData.buyer = {ß
      //     connect: { id: buyerId },
      //   };
      // }

      // // Update user relation
      // if (userId) {
      //   prismaData.user = {
      //     connect: { id: userId },
      //   };
      // }

      // Update invoice terms
      if (invoiceTermsId) {
        prismaData.invoiceTerms = {
          connect: { id: invoiceTermsId },
        };
      }

      // Update invoice items (replace old ones)
      if (type && invoiceItem) {
        let invoiceItemCreateData: any;

        switch (type) {
          case InvoiceType.FABRIC:
            invoiceItemCreateData = this.mapInvoiceItemData(
              invoiceItem.fabricItem,
              "fabricItem",
            );
            break;

          case InvoiceType.LABEL_TAG:
            invoiceItemCreateData = this.mapInvoiceItemData(
              invoiceItem.labelItem,
              "labelItem",
            );
            break;

          case InvoiceType.CARTON:
            invoiceItemCreateData = this.mapInvoiceItemData(
              invoiceItem.cartonItem,
              "cartonItem",
            );
            break;

          default:
            throw new AppError(400, `Invalid invoice type '${type}'`);
        }

        prismaData.invoiceItems = {
          deleteMany: {}, // remove old items
          create: [invoiceItemCreateData],
        };
      }
      console.log({ prismaData });
      const result = await prisma.invoice.update({
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

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
