import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { LedgerService } from "./ledger.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class LedgerController extends BaseController {
    constructor(private service: LedgerService) {
        super();
    }

    /**
     * Get Buyer Ledger
     */
    public getBuyerLedger = async (req: Request, res: Response) => {
        const { id } = req.validatedParams; // buyer Id
        const query = req.validatedQuery || req.query;

        this.logAction("getBuyerLedger", req, { id, query });

        const result = await this.service.getBuyerLedger(id, query);

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
            "Buyer ledger retrieved successfully",
            result.data,
        );
    };

    /**
     * Get Supplier Ledger
     */
    public getSupplierLedger = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        const query = req.validatedQuery || req.query;

        this.logAction("getSupplierLedger", req, { id, query });

        const result = await this.service.getSupplierLedger(id, query);

        return this.sendResponse(
            res,
            "Supplier ledger retrieved successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Get Dashboard Stats
     */
    public getDashboardStats = async (req: Request, res: Response) => {
        this.logAction("getDashboardStats", req, {});

        const result = await this.service.getDashboardStats();

        return this.sendResponse(
            res,
            "Dashboard stats retrieved successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Get Audit Trail (Recent Entries)
     */
    public getAuditTrail = async (req: Request, res: Response) => {
        this.logAction("getAuditTrail", req, {});

        const query = req.validatedQuery || req.query;
        const result = await this.service.getAuditTrail(query);

        return this.sendResponse(
            res,
            "Audit trail retrieved successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Get all buyer balances
     */
    public getBuyerBalances = async (req: Request, res: Response) => {
        this.logAction("getBuyerBalances", req, {});
        const result = await this.service.getBuyerBalances();
        return this.sendResponse(res, "Buyer balances retrieved", HTTPStatusCode.OK, result);
    };

    /**
     * Get all supplier balances
     */
    public getSupplierBalances = async (req: Request, res: Response) => {
        this.logAction("getSupplierBalances", req, {});
        const result = await this.service.getSupplierBalances();
        return this.sendResponse(res, "Supplier balances retrieved", HTTPStatusCode.OK, result);
    };
}
