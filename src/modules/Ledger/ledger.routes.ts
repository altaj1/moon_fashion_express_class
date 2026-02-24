import { Router, Request, Response } from "express";
import { LedgerController } from "./ledger.controller";
import { LedgerValidation } from "./ledger.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class LedgerRoutes {
    private router: Router;
    private controller: LedgerController;

    constructor(controller: LedgerController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        const listValidator = validateRequest({
            query: LedgerValidation.query.ledgerList,
        });

        const buyerIdValidator = validateRequest({
            params: LedgerValidation.params.buyerId,
        });

        const supplierIdValidator = validateRequest({
            params: LedgerValidation.params.supplierId,
        });

        // =========================
        // Define Routes
        // =========================

        // Get Buyer Ledger
        this.router.get(
            "/buyer/:id",
            authenticate,
            buyerIdValidator,
            listValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.getBuyerLedger(req, res),
            ),
        );

        // Get Supplier Ledger
        this.router.get(
            "/supplier/:id",
            authenticate,
            supplierIdValidator,
            listValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.getSupplierLedger(req, res),
            ),
        );

        // Get Dashboard Stats
        this.router.get(
            "/dashboard/stats",
            authenticate,
            asyncHandler((req: Request, res: Response) =>
                this.controller.getDashboardStats(req, res),
            ),
        );

        // Get Audit Trail
        this.router.get(
            "/audit-trail",
            authenticate,
            asyncHandler((req: Request, res: Response) =>
                this.controller.getAuditTrail(req, res),
            ),
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
