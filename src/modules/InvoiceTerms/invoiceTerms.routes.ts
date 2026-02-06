import { Router, Request, Response } from "express";
import { InvoiceTermsController } from "./invoiceTerms.controller";
import { InvoiceTermsValidation } from "./invoiceTerms.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";

export class InvoiceTermsRoutes {
  private router: Router;
  private controller: InvoiceTermsController;

  constructor(controller: InvoiceTermsController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: InvoiceTermsValidation.create,
    });
    const updateValidator = validateRequest({
      params: InvoiceTermsValidation.params.id,
      body: InvoiceTermsValidation.update,
    });
    const idValidator = validateRequest({
      params: InvoiceTermsValidation.params.id,
    });

    // Define Routes
    this.router.post(
      "/",
      createValidator,
      asyncHandler((req, res) => this.controller.create(req, res)),
    );
    this.router.get(
      "/",
      asyncHandler((req, res) => this.controller.getInvoiceTerms(req, res)),
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
    this.router.put(
      "/:id",
      idValidator,
      asyncHandler((req, res) => this.controller.softDelete(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
