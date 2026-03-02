import { Router, Request, Response } from "express";
import { AnalyticsController } from "./analytics.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class AnalyticsRoutes {
  private router: Router;
  private controller: AnalyticsController;

  constructor(controller: AnalyticsController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Summary counts (buyers, users, orders)
    this.router.get("/", authenticate, asyncHandler((req, res) => this.controller.getAll(req, res)));

    // Financial overview
    this.router.get("/financial-overview", authenticate, asyncHandler((req, res) => this.controller.getFinancialOverview(req, res)));

    // Revenue vs Expense — 12-month trend
    this.router.get("/revenue-trend", authenticate, asyncHandler((req, res) => this.controller.getRevenueTrend(req, res)));

    // Daily order volume trend (with optional date filter)
    this.router.get("/order-trend", authenticate, asyncHandler((req, res) => this.controller.getOrderTrend(req, res)));

    // Top buyers by revenue (with optional date filter)
    this.router.get("/top-buyers", authenticate, asyncHandler((req, res) => this.controller.getTopBuyers(req, res)));

    // AR aging buckets
    this.router.get("/ar-aging", authenticate, asyncHandler((req, res) => this.controller.getARaging(req, res)));

    // AP aging buckets
    this.router.get("/ap-aging", authenticate, asyncHandler((req, res) => this.controller.getAPaging(req, res)));

    // Weekly cash flow: inflow vs outflow
    this.router.get("/cash-flow", authenticate, asyncHandler((req, res) => this.controller.getCashFlow(req, res)));

    // Weekly accounts payable flow to suppliers
    this.router.get("/payable-flow", authenticate, asyncHandler((req, res) => this.controller.getPayableFlow(req, res)));

    // Dashboard alerts (pending orders, overdue AR)
    this.router.get("/alerts", authenticate, asyncHandler((req, res) => this.controller.getDashboardAlerts(req, res)));
  }

  public getRouter(): Router {
    return this.router;
  }
}
