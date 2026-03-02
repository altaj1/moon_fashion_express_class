import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { AnalyticsService } from "./analytics.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class AnalyticsController extends BaseController {
  constructor(private service: AnalyticsService) {
    super();
  }

  /** Summary counts: buyers, users, orders */
  public getAll = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    this.logAction("getAllAnalytics", req, { startDate, endDate });
    const result = await this.service.getAllAnalytics(
      startDate as string,
      endDate as string,
    );
    return this.sendResponse(res, "Analytics retrieved successfully", HTTPStatusCode.OK, result);
  };

  /** Financial overview: cash, bank, receivable, payable, revenue, expense, netProfit, workingCapital */
  getFinancialOverview = async (req: Request, res: Response) => {
    const result = await this.service.getFinancialOverview();
    return this.sendResponse(res, "Financial overview retrieved successfully", HTTPStatusCode.OK, result);
  };

  /** 12-month revenue vs expense trend */
  getRevenueTrend = async (req: Request, res: Response) => {
    const result = await this.service.getRevenueTrend();
    return this.sendResponse(res, "Revenue trend retrieved", HTTPStatusCode.OK, result);
  };

  /** Daily order count over last N days */
  getOrderTrend = async (req: Request, res: Response) => {
    const days = Number(req.query.days) || 30;
    const result = await this.service.getOrderTrend(days);
    return this.sendResponse(res, "Order trend retrieved", HTTPStatusCode.OK, result);
  };

  /** Top 5 buyers by revenue */
  getTopBuyers = async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5;
    const result = await this.service.getTopBuyers(limit);
    return this.sendResponse(res, "Top buyers retrieved", HTTPStatusCode.OK, result);
  };

  /** AR aging buckets */
  getARaging = async (req: Request, res: Response) => {
    const result = await this.service.getARaging();
    return this.sendResponse(res, "AR aging retrieved", HTTPStatusCode.OK, result);
  };

  /** 6-week cash flow: inflow vs outflow */
  getCashFlow = async (req: Request, res: Response) => {
    const weeks = Number(req.query.weeks) || 6;
    const result = await this.service.getCashFlow(weeks);
    return this.sendResponse(res, "Cash flow retrieved", HTTPStatusCode.OK, result);
  };

  /** Dashboard alerts: pending orders, overdue AR */
  getDashboardAlerts = async (req: Request, res: Response) => {
    const result = await this.service.getDashboardAlerts();
    return this.sendResponse(res, "Alerts retrieved", HTTPStatusCode.OK, result);
  };
}
