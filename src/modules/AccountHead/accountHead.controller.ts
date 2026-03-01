import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { AccountHeadService } from "./accountHead.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class AccountHeadController extends BaseController {
  constructor(private service: AccountHeadService) {
    super();
  }

  /**
   * Create a new AccountHead
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });
    // const existing = await this.service.findMany({
    //   where: { code: body.code },
    // });

    const result = await this.service.create(body);

    return this.sendCreatedResponse(
      res,
      result,
      "AccountHead created successfully",
    );
  };

  /**
   * Get all AccountHeads
   */
  public getAll = async (req: Request, res: Response) => {
    const pagination = this.extractPaginationParams(req);
    this.logAction("getAll", req, { pagination });
    const query = req.validatedQuery || req.query;
    const { search, type } = query;

    const filters: any = {};
    if (type) {
      filters.type = type;
    }
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const result = await this.service.findMany(filters, pagination);

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
      "AccountHeads retrieved successfully",
      result.data,
    );
  };

  /**
   * Get single AccountHead
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "AccountHead not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "AccountHead retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update AccountHead
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "AccountHead not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "AccountHead updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete AccountHead
   */
  public updateByAdmin = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "AccountHead not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateByAdmin(id, body);

    return this.sendResponse(
      res,
      "AccountHead updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };
}
