import { InvoiceCreateInput } from "./../../generated/prisma/models/Invoice";
import { BaseService } from "@/core/BaseService";
import { prisma } from "@/lib/prisma";
import { PrismaClient, Prisma } from "@/generated/prisma/client";
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

  public async create(
    data: CreateInvoiceInput,
    userId: string | undefined,
    include?: Prisma.InvoiceInclude,
  ) {
    try {
      const { invoiceTermsId, orderId, status, ...invoiceRest } = data;

      if (!userId) {
        throw new AppError(401, "Unauthorized. User ID missing.");
      }
      if (!orderId) {
        throw new AppError(400, "orderId is required to create an invoice.");
      }
      if (!invoiceTermsId) {
        throw new AppError(
          400,
          "invoiceTermsId is required to create an invoice.",
        );
      }
      // ✅ Build Prisma payload
      const prismaData: any = {
        ...invoiceRest,

        date: new Date(data.date),

        // Required relation
        order: {
          connect: { id: orderId },
        },

        // Auth user
        user: {
          connect: { id: userId },
        },

        // Optional relation
        ...(invoiceTermsId && {
          invoiceTerms: {
            connect: { id: invoiceTermsId },
          },
        }),

        ...(status && { status }),
      };

      const result = super.create(prismaData, include);
      console.log({ result });
      const updateOrderIsInvoice = await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          isInvoice: true,
        },
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
    console.log("Finding invoices with query:", JSON.stringify(query));
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      ...restFilters
    } = query;

    // Build search filters
    const filters: any = { ...restFilters };
    if (search) {
      filters.OR = [
        { piNumber: { contains: search, mode: "insensitive" } },
        // { status: { contains: search, mode: "insensitive" } },
      ];
    }

    const order: Record<string, "asc" | "desc"> = { [sortBy]: sortOrder };

    // Pagination
    const pagination = { page, limit };

    // Call BaseService findMany
    return super.findMany(filters, pagination, order, {
      user: true,
      invoiceTerms: true,
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
    });
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, {
      user: true,
      invoiceTerms: true,
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
    });
  }

  public async updateById(
    id: string,
    data: UpdateInvoiceInput,
    userId?: string,
    include?: any,
  ) {
    try {
      const { invoiceTermsId, ...invoiceRest } = data;

      const prismaData: any = {
        ...invoiceRest,
        ...(invoiceTermsId && {
          invoiceTerms: { connect: { id: invoiceTermsId } },
        }),
      };

      return super.updateById(id, prismaData, include);
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
