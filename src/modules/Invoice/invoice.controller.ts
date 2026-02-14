import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { InvoiceService } from "./invoice.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class InvoiceController extends BaseController {
  constructor(private service: InvoiceService) {
    super();
  }

  /**
   * Create a new Invoice
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });
    console.log("controller user id", req.userId);
    const result = await this.service.create(body, req.userId);

    return this.sendCreatedResponse(
      res,
      result,
      "Invoice created successfully",
    );
  };

  /**
   * Get all Invoices
   */
  public getAll = async (req: Request, res: Response) => {
    const query = req.validatedQuery || req.query;

    this.logAction("getAll", req, { query });

    const {
      page = 1,
      limit = 10,
      search,
      status,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    // Build filters
    const filters: any = {};

    // Handle search safely
    if (search) {
      const enumValues = ["DRAFT", "SENT", "APPROVED", "CANCELLED"]; // your enum
      const searchEnum = enumValues.find((val) => val === search.toUpperCase());

      filters.OR = [
        { piNumber: { contains: search, mode: "insensitive" } },
        ...(searchEnum ? [{ status: searchEnum }] : []),
      ];
    }

    // Filter by exact status if provided separately
    if (status) {
      filters.status = status;
    }

    // Date filters
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.gte = new Date(startDate as string);
      if (endDate) filters.date.lte = new Date(endDate as string);
    }

    // Call service
    const result = await this.service.findMany({
      ...filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    // Transform each order's orderItems array into a single object
    const transformedData = result.data.map((invoice: any) => ({
      ...invoice,
      order: {
        ...invoice.order,
        orderItems: invoice.order?.orderItems?.[0] || null,
      },
    }));
    // Send paginated response
    return this.sendPaginatedResponse(
      res,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious,
      },
      "Invoices retrieved successfully",
      transformedData,
    );
  };

  /**
   * Get single Invoice
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);
    console.log({ result });
    if (!result) {
      return this.sendResponse(
        res,
        "Invoice not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    // Transform orderItems array into a single object
    const transformedResult = {
      ...result,
      order: {
        ...result.order,
        orderItems: result.order?.orderItems?.[0] || null,
      },
    };
    return this.sendResponse(
      res,
      "Invoice retrieved successfully",
      HTTPStatusCode.OK,
      transformedResult,
    );
  };

  /**
   * Update Invoice
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Invoice not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "Invoice updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Invoice
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Invoice not found",
        HTTPStatusCode.NOT_FOUND,
        false,
      );
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "Invoice deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
