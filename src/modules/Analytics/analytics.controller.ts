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
    return this.sendResponse(
      res,
      "Analytics retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** Financial overview: cash, bank, receivable, payable, revenue, expense, netProfit, workingCapital */
  getFinancialOverview = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    const result = await this.service.getFinancialOverview(
      startDate as string,
      endDate as string,
    );
    return this.sendResponse(
      res,
      "Financial overview retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** 12-month revenue vs expense trend */
  getRevenueTrend = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    const result = await this.service.getRevenueTrend(
      startDate as string | undefined,
      endDate as string | undefined,
    );
    return this.sendResponse(
      res,
      "Revenue trend retrieved",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** Daily order count — supports startDate/endDate or days param */
  getOrderTrend = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    const days = Number(req.query.days) || 30;
    const result = await this.service.getOrderTrend(
      startDate as string | undefined,
      endDate as string | undefined,
      days,
    );
    return this.sendResponse(
      res,
      "Order trend retrieved",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** Top buyers by revenue — supports startDate/endDate filter */
  getTopBuyers = async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5;
    const { startDate, endDate } = req.query;
    const result = await this.service.getTopBuyers(
      limit,
      startDate as string | undefined,
      endDate as string | undefined,
    );
    return this.sendResponse(
      res,
      "Top buyers retrieved",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** AR aging buckets */
  getARaging = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    const result = await this.service.getARaging(
      startDate as string | undefined,
      endDate as string | undefined,
    );
    return this.sendResponse(
      res,
      "AR aging retrieved",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** AP aging buckets */
  getAPaging = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    const result = await this.service.getAPaging(
      startDate as string | undefined,
      endDate as string | undefined,
    );
    return this.sendResponse(
      res,
      "AP aging retrieved",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** 6-week cash flow: inflow vs outflow */
  getCashFlow = async (req: Request, res: Response) => {
    const weeks = Number(req.query.weeks) || 6;
    const { startDate, endDate } = req.query;
    const result = await this.service.getCashFlow(
      weeks,
      startDate as string | undefined,
      endDate as string | undefined,
    );
    return this.sendResponse(
      res,
      "Cash flow retrieved",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** Dashboard alerts: pending orders, overdue AR */
  getDashboardAlerts = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    const result = await this.service.getDashboardAlerts(
      startDate as string | undefined,
      endDate as string | undefined,
    );
    return this.sendResponse(
      res,
      "Alerts retrieved",
      HTTPStatusCode.OK,
      result,
    );
  };

  /** Weekly accounts payable flow to suppliers */
  getPayableFlow = async (req: Request, res: Response) => {
    const weeks = Number(req.query.weeks) || 6;
    const result = await this.service.getPayableFlow(weeks);
    return this.sendResponse(
      res,
      "Payable flow retrieved",
      HTTPStatusCode.OK,
      result,
    );
  };
}
