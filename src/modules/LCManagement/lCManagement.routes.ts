import { Router, Request, Response } from "express";
import { LCManagementController } from "./lCManagement.controller";
import { LCManagementValidation } from "./lCManagement.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class LCManagementRoutes {
  private router: Router;
  private controller: LCManagementController;

  constructor(controller: LCManagementController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: LCManagementValidation.create,
    });
    const updateValidator = validateRequest({
      params: LCManagementValidation.params.id,
      body: LCManagementValidation.update,
    });
    const idValidator = validateRequest({
      params: LCManagementValidation.params.id,
    });
    const listValidator = validateRequest({
      query: LCManagementValidation.query.list,
    });
    // Define Routes
    this.router.post(
      "/",
      authenticate,
      createValidator,
      asyncHandler((req, res) => this.controller.create(req, res)),
    );
    this.router.get(
      "/",
      listValidator,
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
