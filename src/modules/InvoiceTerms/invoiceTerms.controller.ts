import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { InvoiceTermsService } from "./invoiceTerms.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class InvoiceTermsController extends BaseController {
  constructor(private service: InvoiceTermsService) {
    super();
  }

  /**
   * Create Invoice Terms
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });

    const result = await this.service.create(body);

    return this.sendCreatedResponse(
      res,
      result,
      "Invoice terms created successfully",
    );
  };

  /**
   * Get all Invoice Terms
   */
  public getInvoiceTerms = async (req: Request, res: Response) => {
    const query = req.validatedQuery || req.query;
    this.logAction("getAll", req, { query });

    const result = await this.service.getInvoiceTerms(query);

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
      "Invoice terms retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single Invoice Terms
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Invoice terms not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Invoice terms retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Invoice Terms
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Invoice terms not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "Invoice terms updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Invoice Terms (Soft Delete)
   */
  public softDelete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;

    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Invoice terms not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.softDelete(id, body?.isDeleted ?? true);

    return this.sendResponse(
      res,
      "Invoice terms deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
