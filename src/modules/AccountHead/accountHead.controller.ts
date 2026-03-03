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
    // const pagination = this.extractPaginationParams(req);
    const query = req.validatedQuery || req.query;
    const { search, type, sortBy, sortOrder, isDeleted } = query;
    // this.logAction("getAll", req, { pagination, query });

    const filters: any = {};
    if (type) {
      filters.type = type;
    }
    if (typeof isDeleted === "boolean") {
      filters.isDeleted = isDeleted;
    }
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : undefined;

    const result = await this.service.findManyAccountHead(filters, orderBy);

    return this.sendPaginatedResponse(
      res,
      {
        page: 0,
        limit: 0,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
      "AccountHeads retrieved successfully",
      result,
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
