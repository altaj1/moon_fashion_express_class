import { Router, Request, Response } from "express";
import { ReceiptController } from "./receipt.controller";
import { ReceiptValidation } from "./receipt.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class ReceiptRoutes {
    private router: Router;
    private controller: ReceiptController;

    constructor(controller: ReceiptController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        const createBuyerReceipt = validateRequest({
            body: ReceiptValidation.createBuyerReceipt,
        });

        const listParams = validateRequest({
            query: ReceiptValidation.query.list,
        });

        // =========================
        // Define Routes
        // =========================

        // Create a Buyer Receipt (which creates a Journal Entry)
        this.router.post(
            "/buyer",
            authenticate,
            createBuyerReceipt,
            asyncHandler((req: Request, res: Response) =>
                this.controller.createBuyerReceipt(req, res),
            ),
        );

        // List all receipts
        this.router.get(
            "/",
            authenticate,
            listParams,
            asyncHandler((req: Request, res: Response) =>
                this.controller.getReceipts(req, res),
            ),
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
