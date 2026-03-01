import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { AnalyticsService } from "./analytics.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class AnalyticsController extends BaseController {
  constructor(private service: AnalyticsService) {
    super();
  }

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

  getFinancialOverview = async (req: Request, res: Response) => {
    const result = await this.service.getFinancialOverview();

    return this.sendResponse(
      res,
      "Financial overview retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };
}
