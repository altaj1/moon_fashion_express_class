import { Router, Request, Response } from "express";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsValidation } from "./analytics.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";

export class AnalyticsRoutes {
  private router: Router;
  private controller: AnalyticsController;

  constructor(controller: AnalyticsController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Define Routes
    this.router.get(
      "/",
      asyncHandler((req, res) => this.controller.getAll(req, res)),
    );

    this.router.get(
      "/financial-overview",
      asyncHandler((req, res) =>
        this.controller.getFinancialOverview(req, res),
      ),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
