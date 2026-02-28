import { Router } from "express";
import { FinancialReportController } from "./financialReport.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class FinancialReportRoutes {
    private router: Router;
    private controller: FinancialReportController;

    constructor(controller: FinancialReportController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(
            "/trial-balance",
            authenticate,
            asyncHandler((req, res) => this.controller.getTrialBalance(req, res)),
        );
        this.router.get(
            "/generate-report",
            authenticate,
            asyncHandler((req, res) => this.controller.generateReport(req, res)),
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
