import { Router, Request, Response } from "express";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class PaymentRoutes {
    private router: Router;
    private controller: PaymentController;

    constructor(controller: PaymentController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        const createSupplierPayment = validateRequest({
            body: PaymentValidation.createSupplierPayment,
        });

        const listParams = validateRequest({
            query: PaymentValidation.query.list,
        });

        // =========================
        // Define Routes
        // =========================

        // Create a Supplier Payment (which creates a Journal Entry)
        this.router.post(
            "/supplier",
            authenticate,
            createSupplierPayment,
            asyncHandler((req: Request, res: Response) =>
                this.controller.createSupplierPayment(req, res),
            ),
        );

        // List all payments
        this.router.get(
            "/",
            authenticate,
            listParams,
            asyncHandler((req: Request, res: Response) =>
                this.controller.getPayments(req, res),
            ),
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
