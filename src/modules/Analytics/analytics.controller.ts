import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { AnalyticsService } from "./analytics.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class AnalyticsController extends BaseController {
  constructor(private service: AnalyticsService) {
    super();
  }

  /**
   * Create a new Analytics
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });

    const result = await this.service.create(body);

    return this.sendCreatedResponse(
      res,
      result,
      "Analytics created successfully",
    );
  };

  /**
   * Get all Analyticss
   */
  /**
   * Get All Analytics (Buyers, Users, Orders)
   */
  public getAll = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    this.logAction("getAllAnalytics", req, { startDate, endDate });

    const result = await this.service.getAllAnalytics(
      startDate as string,
      endDate as string,
    );

    return this.sendResponse(
      res,
      "Analytics retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Get single Analytics
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Analytics not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "Analytics retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Analytics
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Analytics not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "Analytics updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Analytics
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Analytics not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "Analytics deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
