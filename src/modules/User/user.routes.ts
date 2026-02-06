import { Router } from "express";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate } from "@/middleware/auth";
import { upload } from "@/utils/sendImageToCloudinery";

export class UserRoutes {
  private router: Router;
  private controller: UserController;

  constructor(controller: UserController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const updateValidator = validateRequest({
      // params: UserValidation.params.id,
      body: UserValidation.update,
    });

    const idValidator = validateRequest({
      params: UserValidation.params.id,
    });

    const listValidator = validateRequest({
      query: UserValidation.query.list,
    });

    const searchValidator = validateRequest({
      query: UserValidation.query.search,
    });

    // ================= Routes =================

    // List users (pagination + sort + search)
    this.router.get(
      "/",
      listValidator,
      asyncHandler((req, res) => this.controller.getAll(req, res)),
    );

    this.router.get(
      "/my-profile",
      authenticate,
      asyncHandler((req, res) => this.controller.getMyProfile(req, res)),
    );
    // Get single
    this.router.get(
      "/:id",
      idValidator,
      asyncHandler((req, res) => this.controller.getOne(req, res)),
    );

    // updateProfile
    this.router.patch(
      "/update-profile",
      upload.single("avatar"),
      authenticate,
      updateValidator,
      asyncHandler((req, res) => this.controller.updateProfile(req, res)),
    );

    // Delete
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
