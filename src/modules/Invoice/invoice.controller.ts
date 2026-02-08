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

    const result = await this.service.findMany(query);

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
      result.data,
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

    return this.sendResponse(
      res,
      "Invoice retrieved successfully",
      HTTPStatusCode.OK,
      result,
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
