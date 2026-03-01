import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { MoiCashBookService } from "./moiCashBook.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class MoiCashBookController extends BaseController {
  constructor(private service: MoiCashBookService) {
    super();
  }

  /**
   * Create a new MoiCashBook
   */
  public create = async (req: any, res: Response) => {
    const body = req.validatedBody;
    const userId = (req as any).userId;
    this.logAction("create", req, { body });

    const result = await this.service.create({
      ...body,
      createdById: userId,
    });

    return this.sendCreatedResponse(
      res,
      result,
      "MoiCashBook created successfully",
    );
  };

  /**
   * Get all MoiCashBooks
   */
  public getAll = async (req: Request, res: Response) => {
    const pagination = this.extractPaginationParams(req);
    this.logAction("getAll", req, { pagination });
    const query = req.validatedQuery || req.query;

    this.logAction("getAll", req, { query });
    const result = await this.service.findMany(query, pagination);

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
      "MoiCashBooks retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single MoiCashBook
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "MoiCashBook not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "MoiCashBook retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update MoiCashBook
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "MoiCashBook not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "MoiCashBook updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete MoiCashBook
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "MoiCashBook not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "MoiCashBook deleted successfully",
      HTTPStatusCode.OK,
    );
  };

  /**
   * Get summaries by employee
   */
  public getSummaries = async (req: Request, res: Response) => {
    this.logAction("getSummaries", req, {});

    const result = await this.service.getSummaries();

    return this.sendResponse(
      res,
      "Employee summaries retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Get employee detail with transaction history
   */
  public getEmployeeDetail = async (req: Request, res: Response) => {
    const { id } = req.params;
    const pagination = this.extractPaginationParams(req);

    this.logAction("getEmployeeDetail", req, { id, pagination });

    const result = await this.service.getEmployeeDetail(id, pagination);

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
      "Employee details retrieved successfully",
      result.data,
    );
  };

  public getEmployeeSummary = async (req: Request, res: Response) => {
    const { id } = req.params;

    this.logAction("getEmployeeSummary", req, { id });

    const result = await this.service.getEmployeeSummary(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Employee not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Employee summary retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };
}
