import { Router, Request, Response } from "express";
import { SupplierController } from "./supplier.controller";
import { SupplierValidation } from "./supplier.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class SupplierRoutes {
  private router: Router;
  private controller: SupplierController;

  constructor(controller: SupplierController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: SupplierValidation.create,
    });

    const updateValidator = validateRequest({
      params: SupplierValidation.params.id,
      body: SupplierValidation.update,
    });

    const idValidator = validateRequest({
      params: SupplierValidation.params.id,
    });

    // =========================
    // Define Routes
    // =========================

    // Create Supplier
    this.router.post(
      "/",
      authenticate,
      createValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.create(req, res),
      ),
    );

    // Get All Suppliers (with query validation)
    this.router.get(
      "/",
      authenticate,
      validateRequest({
        query: SupplierValidation.query.list,
      }),
      asyncHandler((req: Request, res: Response) =>
        this.controller.getAll(req, res),
      ),
    );

    // Get Single Supplier
    this.router.get(
      "/:id",
      authenticate,
      idValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.getOne(req, res),
      ),
    );

    // Update Supplier
    this.router.patch(
      "/:id",
      authenticate,
      updateValidator,
      asyncHandler((req: Request, res: Response) =>
        this.controller.update(req, res),
      ),
    );

    // Soft Delete Supplier (recommended)
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
