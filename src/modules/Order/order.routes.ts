import { Router, Request, Response } from "express";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";

export class OrderRoutes {
  private router: Router;
  private controller: OrderController;

  constructor(controller: OrderController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({ body: OrderValidation.create });
    const updateValidator = validateRequest({
      params: OrderValidation.params.id,
      body: OrderValidation.update,
    });
    const idValidator = validateRequest({ params: OrderValidation.params.id });
    const listValidator = validateRequest({
      query: OrderValidation.query.list,
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

    this.router.put(
      "/:id/status",
      idValidator,
      updateValidator,
      asyncHandler((req, res) => this.controller.updateStatus(req, res)),
    );
    this.router.put(
      "/:id/soft-delete",
      idValidator,
      updateValidator,
      asyncHandler((req, res) => this.controller.softDeleteOrder(req, res)),
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
