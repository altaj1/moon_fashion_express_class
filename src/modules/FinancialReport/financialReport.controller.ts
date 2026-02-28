import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { FinancialReportService } from "./financialReport.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class FinancialReportController extends BaseController {
    constructor(private service: FinancialReportService) {
        super();
    }

    /**
     * Get Trial Balance
     */
    public getTrialBalance = async (req: Request, res: Response) => {
        const { startDate, endDate } = req.query as { startDate: string; endDate: string };

        if (!startDate || !endDate) {
            return this.sendResponse(
                res,
                "Start date and end date are required",
                HTTPStatusCode.BAD_REQUEST,
            );
        }

        this.logAction("getTrialBalance", req, { startDate, endDate });

        const result = await this.service.getTrialBalance(startDate, endDate);

        return this.sendResponse(
            res,
            "Trial balance retrieved successfully",
            HTTPStatusCode.OK,
            result,
        );
    };
}
