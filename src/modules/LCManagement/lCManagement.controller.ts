import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { LCManagementService } from "./lCManagement.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class LCManagementController extends BaseController {
  constructor(private service: LCManagementService) {
    super();
  }

  /**
   * Create a new LCManagement
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });

    const result = await this.service.create(body, req.userId);

    return this.sendCreatedResponse(
      res,
      result,
      "LCManagement created successfully",
    );
  };

  /**
   * Get all LCManagements
   */
  public getAll = async (req: Request, res: Response) => {
    const query = req.validatedQuery || req.query;

    this.logAction("getAll", req, { query });

    const {
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      expiryStartDate,
      expiryEndDate,
      sortBy = "createdAt",
      sortOrder = "desc",
      isDeleted,
    } = query;

    const filters: any = {};

    // 🔍 Search (bblcNumber, bank name, destination)
    if (search) {
      filters.OR = [
        { bblcNumber: { contains: search, mode: "insensitive" } },
        { lcIssueBankName: { contains: search, mode: "insensitive" } },
        { lcIssueBankBranch: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
      ];
    }

    // Date Range Filter (issueDate)
    if (startDate || endDate) {
      filters.issueDate = {};
      if (startDate) filters.issueDate.gte = new Date(startDate as string);
      if (endDate) filters.issueDate.lte = new Date(endDate as string);
    }

    // Date Range Filter (expiryDate)
    if (expiryStartDate || expiryEndDate) {
      filters.expiryDate = {};
      if (expiryStartDate)
        filters.expiryDate.gte = new Date(expiryStartDate as string);
      if (expiryEndDate)
        filters.expiryDate.lte = new Date(expiryEndDate as string);
    }

    // Amount Range Filter
    if (minAmount || maxAmount) {
      filters.amount = {};
      if (minAmount) filters.amount.gte = Number(minAmount);
      if (maxAmount) filters.amount.lte = Number(maxAmount);
    }
    if (isDeleted) {
      filters.isDeleted = isDeleted;
    } else {
      filters.isDeleted = false;
    }

    const result = await this.service.findMany(
      filters,
      { page, limit },
      { [sortBy]: sortOrder },
    );

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
      "LCManagements retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single LCManagement
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "LCManagement not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "LCManagement retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update LCManagement
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "LCManagement not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "LCManagement updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete LCManagement
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "LCManagement not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "LCManagement deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
