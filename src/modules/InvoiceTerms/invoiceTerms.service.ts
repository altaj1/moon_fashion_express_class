import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateInvoiceTermsInput,
  UpdateInvoiceTermsInput,
  ListInvoiceTermsQueryDto,
} from "./invoiceTerms.validation";

export class InvoiceTermsService extends BaseService<
  any,
  CreateInvoiceTermsInput,
  UpdateInvoiceTermsInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "InvoiceTerms", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore
    return this.prisma.invoiceTerms;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // =========================================================================

  public async create(data: CreateInvoiceTermsInput, include?: any) {
    return super.create(data, include);
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, include);
  }

  /**
   * Get InvoiceTerms with pagination, search, and sorting
   */

  public async getInvoiceTerms(query: ListInvoiceTermsQueryDto) {
    const {
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      limit,
      page,
      isDeleted,
    } = query;

    // --- Type Conversion ---
    const pageNum = Math.max(Number(page) || 1, 1); // ensure number
    const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 100); // ensure number 1-100
    const isDeletedBool =
      typeof isDeleted === "boolean"
        ? isDeleted
        : isDeleted === "true"
          ? true
          : false; // convert string "true"/"false" to boolean

    console.log("Converted query types:", {
      pageNum,
      limitNum,
      isDeletedBool,
      search,
    });

    // --- Build filters ---
    const filters: any = {};
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { payment: { contains: search, mode: "insensitive" } },
        { delivery: { contains: search, mode: "insensitive" } },
        { advisingBank: { contains: search, mode: "insensitive" } },
        { negotiation: { contains: search, mode: "insensitive" } },
        { origin: { contains: search, mode: "insensitive" } },
      ];
    }

    // Always set boolean explicitly
    filters.isDeleted = isDeletedBool;

    console.log("Filters for getInvoiceTerms:", JSON.stringify(filters));

    const skip = (pageNum - 1) * limitNum;

    // --- Total count ---
    const total = await this.prisma.invoiceTerms.count({ where: filters });

    // --- Fetch paginated data ---
    const data = await this.prisma.invoiceTerms.findMany({
      where: filters,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrevious: pageNum > 1,
      data,
    };
  }
  public async updateById(
    id: string,
    data: UpdateInvoiceTermsInput,
    include?: any,
  ) {
    return super.updateById(id, data, include);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async softDelete(id: string | number, isDeleted: boolean = true) {
    return super.updateById(id as string, {
      isDeleted,
    });
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
