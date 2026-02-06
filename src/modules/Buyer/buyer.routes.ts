import { Router, Request, Response } from "express";
import { BuyerController } from "./buyer.controller";
import { BuyerValidation } from "./buyer.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";

export class BuyerRoutes {
  private router: Router;
  private controller: BuyerController;

  constructor(controller: BuyerController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({ body: BuyerValidation.create });
    const updateValidator = validateRequest({
      params: BuyerValidation.params.id,
      body: BuyerValidation.update,
    });
    const idValidator = validateRequest({ params: BuyerValidation.params.id });

    // Define Routes
    this.router.post(
      "/",
      createValidator,
      asyncHandler((req, res) => this.controller.create(req, res)),
    );

    this.router.get(
      "/",
      validateRequest({
        query: BuyerValidation.query.list,
      }),
      asyncHandler((req: Request, res: Response) =>
        this.controller.getBuyers(req, res),
      ),
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
      updateValidator,
      idValidator,
      asyncHandler((req, res) => this.controller.delete(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
