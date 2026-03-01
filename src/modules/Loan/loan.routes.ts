import { Router, Request, Response } from "express";
import { LoanController } from "./loan.controller";
import { LoanValidation } from "./loan.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class LoanRoutes {
  private router: Router;
  private controller: LoanController;

  constructor(controller: LoanController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: LoanValidation.create,
    });

    const updateValidator = validateRequest({
      params: LoanValidation.params.id,
      body: LoanValidation.update,
    });

    const idValidator = validateRequest({
      params: LoanValidation.params.id,
    });

    const repaymentValidator = validateRequest({
      params: LoanValidation.params.id,
      body: LoanValidation.repayment,
    });

    // =========================
    // Define Routes
    // =========================

    // Create Loan
    this.router.post(
      "/",
      authenticate,
      createValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.create(req, res),
      ),
    );

    // Get All Loans
    this.router.get(
      "/",
      authenticate,
      validateRequest({
        query: LoanValidation.query.list,
      }),
      asyncHandler((req: Request, res: Response) =>
        this.controller.getAll(req, res),
      ),
    );

    // Get Single Loan
    this.router.get(
      "/:id",
      authenticate,
      idValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.getOne(req, res),
      ),
    );

    // Update Loan
    this.router.patch(
      "/:id",
      authenticate,
      updateValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.update(req, res),
      ),
    );

    // Soft Delete Loan
    this.router.put(
      "/:id",
      authenticate,
      idValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.delete(req, res),
      ),
    );

    // =========================
    // Repayment Routes
    // =========================

    // Record Repayment
    this.router.post(
      "/:id/repayments",
      authenticate,
      repaymentValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.recordRepayment(req, res),
      ),
    );

    // Get Repayments for a Loan
    this.router.get(
      "/:id/repayments",
      authenticate,
      idValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.getRepayments(req, res),
      ),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
