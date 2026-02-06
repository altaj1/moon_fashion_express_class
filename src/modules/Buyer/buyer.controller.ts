import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { BuyerService } from "./buyer.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class BuyerController extends BaseController {
  constructor(private service: BuyerService) {
    super();
  }

  /**
   * Create a new Buyer
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });

    const result = await this.service.create(body);

    return this.sendCreatedResponse(res, result, "Buyer created successfully");
  };

  /**
   * Get all Buyers
   */
  public getBuyers = async (req: Request, res: Response) => {
    const query = req.validatedQuery || req.query;

    this.logAction("getAll", req, { query });

    const result = await this.service.getBuyers(query);

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
      "Buyers retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single Buyer
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Buyer not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Buyer retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Buyer
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Buyer not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "Buyer updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Buyer
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });
    const body = req.validatedBody;

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Buyer not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.softDelete({
      id,
      isDeleted: body?.isDeleted ?? true,
    });

    return this.sendResponse(
      res,
      "Buyer deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
