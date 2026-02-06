import { Router, Request, Response } from "express";
import { InvoiceController } from "./invoice.controller";
import { InvoiceValidation } from "./invoice.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";

export class InvoiceRoutes {
  private router: Router;
  private controller: InvoiceController;

  constructor(controller: InvoiceController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({ body: InvoiceValidation.create });
    const updateValidator = validateRequest({
      params: InvoiceValidation.params.id,
      body: InvoiceValidation.update,
    });
    const idValidator = validateRequest({
      params: InvoiceValidation.params.id,
    });

    // Define Routes
    this.router.post(
      "/",
      createValidator,
      asyncHandler((req, res) => this.controller.create(req, res)),
    );
    this.router.get(
      "/",
      asyncHandler((req, res) => this.controller.getAll(req, res)),
    );
    this.router.get(
      "/:id",
      idValidator,
      asyncHandler((req, res) => this.controller.getOne(req, res)),
    );
    this.router.patch(
      "/:id",
      updateValidator,
      asyncHandler((req, res) => this.controller.update(req, res)),
    );
    this.router.delete(
      "/:id",
      idValidator,
      asyncHandler((req, res) => this.controller.delete(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
