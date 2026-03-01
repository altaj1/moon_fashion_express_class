import { Router, Request, Response } from "express";
import { JournalEntryController } from "./journalEntry.controller";
import { JournalEntryValidation } from "./journalEntry.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class JournalEntryRoutes {
    private router: Router;
    private controller: JournalEntryController;

    constructor(controller: JournalEntryController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        const createValidator = validateRequest({
            body: JournalEntryValidation.create,
        });

        const updateValidator = validateRequest({
            params: JournalEntryValidation.params.id,
            body: JournalEntryValidation.update,
        });

        const idValidator = validateRequest({
            params: JournalEntryValidation.params.id,
        });

        // =========================
        // Define Routes
        // =========================

        // Create Journal Entry (always starts as DRAFT)
        this.router.post(
            "/",
            authenticate,
            createValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.create(req, res),
            ),
        );

        // Get All Journal Entries (with query validation)
        this.router.get(
            "/",
            authenticate,
            validateRequest({
                query: JournalEntryValidation.query.list,
            }),
            asyncHandler((req: Request, res: Response) =>
                this.controller.getAll(req, res),
            ),
        );

        // Get Single Journal Entry
        this.router.get(
            "/:id",
            authenticate,
            idValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.getOne(req, res),
            ),
        );

        // Update Journal Entry (DRAFT only — controller enforces this)
        this.router.patch(
            "/:id",
            authenticate,
            updateValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.update(req, res),
            ),
        );

        // Delete Journal Entry (DRAFT only — controller enforces this)
        this.router.delete(
            "/:id",
            authenticate,
            idValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.delete(req, res),
            ),
        );

        // =========================
        // Accounting Action Routes
        // =========================

        // POST a draft entry → validates debit=credit, updates account balances, locks entry
        this.router.post(
            "/:id/post",
            authenticate,
            idValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.post(req, res),
            ),
        );

        // REVERSE a posted entry → creates a counter-entry with flipped debits/credits
        this.router.post(
            "/:id/reverse",
            authenticate,
            idValidator,
            asyncHandler((req: Request, res: Response) =>
                this.controller.reverse(req, res),
            ),
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
