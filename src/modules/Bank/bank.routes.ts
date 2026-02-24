import { Router, Request, Response } from "express";
import { BankController } from "./bank.controller";
import { BankValidation } from "./bank.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class BankRoutes {
    private router: Router;
    private controller: BankController;

    constructor(controller: BankController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        const createValidator = validateRequest({
            body: BankValidation.create,
        });

        const updateValidator = validateRequest({
            params: BankValidation.params.id,
            body: BankValidation.update,
        });

        const idValidator = validateRequest({
            params: BankValidation.params.id,
        });

        // =========================
        // Define Routes
        // =========================

        // Create Bank
        this.router.post(
            "/",
            authenticate,
            createValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.create(req, res),
            ),
        );

        // Get All Banks (with query validation)
        this.router.get(
            "/",
            authenticate,
            validateRequest({
                query: BankValidation.query.list,
            }),
            asyncHandler((req: Request, res: Response) =>
                this.controller.getAll(req, res),
            ),
        );

        // Get Single Bank
        this.router.get(
            "/:id",
            authenticate,
            idValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.getOne(req, res),
            ),
        );

        // Update Bank
        this.router.patch(
            "/:id",
            authenticate,
            updateValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.update(req, res),
            ),
        );

        // Soft Delete Bank
        this.router.put(
            "/:id",
            authenticate,
            idValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.delete(req, res),
            ),
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
