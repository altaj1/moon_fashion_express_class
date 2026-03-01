import { Router, Request, Response } from "express";
import { AccountHeadController } from "./accountHead.controller";
import { AccountHeadValidation } from "./accountHead.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";

export class AccountHeadRoutes {
  private router: Router;
  private controller: AccountHeadController;

  constructor(controller: AccountHeadController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: AccountHeadValidation.create,
    });
    const updateValidator = validateRequest({
      params: AccountHeadValidation.params.id,
      body: AccountHeadValidation.update,
    });
    const idValidator = validateRequest({
      params: AccountHeadValidation.params.id,
    });
    const listValidator = validateRequest({
      query: AccountHeadValidation.query.list,
    });
    // Define Routes
    this.router.post(
      "/",
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
    this.router.put(
      "/:id/update-admin",
      updateValidator,
      asyncHandler((req, res) => this.controller.updateByAdmin(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
