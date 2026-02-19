import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { SupplierService } from "./supplier.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class SupplierController extends BaseController {
  constructor(private service: SupplierService) {
    super();
  }

  /**
   * Create Supplier
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    const userId = req.userId;

    this.logAction("create", req, { body, userId });

    const result = await this.service.create({
      userId,
      ...body,
    });

    return this.sendCreatedResponse(
      res,
      result,
      "Supplier created successfully",
    );
  };

  /**
   * Get All Suppliers (with query support)
   */
  public getAll = async (req: Request, res: Response) => {
    const query = req.validatedQuery || req.query;

    this.logAction("getAll", req, { query });

    const result = await this.service.getSuppliers(query);

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
      "Suppliers retrieved successfully",
      result.data,
    );
  };

  /**
   * Get Single Supplier
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;

    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Supplier not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Supplier retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Supplier
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;

    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });

    if (!exists) {
      return this.sendResponse(
        res,
        "Supplier not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "Supplier updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Soft Delete Supplier
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;

    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });

    if (!exists) {
      return this.sendResponse(
        res,
        "Supplier not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.softDelete({
      id,
      isDeleted: body?.isDeleted ?? true,
    });

    return this.sendResponse(
      res,
      "Supplier deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
