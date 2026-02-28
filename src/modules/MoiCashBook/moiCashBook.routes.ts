import { Router, Request, Response } from "express";
import { MoiCashBookController } from "./moiCashBook.controller";
import { MoiCashBookValidation } from "./moiCashBook.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class MoiCashBookRoutes {
  private router: Router;
  private controller: MoiCashBookController;

  constructor(controller: MoiCashBookController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: MoiCashBookValidation.create,
    });
    const updateValidator = validateRequest({
      params: MoiCashBookValidation.params.id,
      body: MoiCashBookValidation.update,
    });
    const idValidator = validateRequest({
      params: MoiCashBookValidation.params.id,
    });

    // Define Routes
    this.router.post(
      "/",
      createValidator,
      asyncHandler((req, res) => this.controller.create(req, res)),
    );
    this.router.get(
      "/summaries",
      asyncHandler((req, res) => this.controller.getSummaries(req, res)),
    );
    this.router.get(
      "/employee/:id",
      authenticate,
      asyncHandler((req, res) => this.controller.getEmployeeDetail(req, res)),
    );
    this.router.get(
      "/employee/:id/summary",
      authenticate,
      asyncHandler((req, res) => this.controller.getEmployeeSummary(req, res)),
    );
    this.router.get(
      "/",
      validateRequest({
        query: MoiCashBookValidation.query.list,
      }),
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
