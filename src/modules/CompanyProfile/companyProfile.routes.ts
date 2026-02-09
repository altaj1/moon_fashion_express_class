import { Router, Request, Response } from "express";
import { CompanyProfileController } from "./companyProfile.controller";
import { CompanyProfileValidation } from "./companyProfile.validation";
import { validateRequest } from "@/middleware/validation";
import { asyncHandler } from "@/middleware/asyncHandler";
import { upload } from "@/utils/sendImageToCloudinery";
export class CompanyProfileRoutes {
  private router: Router;
  private controller: CompanyProfileController;

  constructor(controller: CompanyProfileController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const createValidator = validateRequest({
      body: CompanyProfileValidation.create,
    });
    const updateValidator = validateRequest({
      params: CompanyProfileValidation.params.id,
      body: CompanyProfileValidation.update,
    });
    const idValidator = validateRequest({
      params: CompanyProfileValidation.params.id,
    });
    const listValidator = validateRequest({
      query: CompanyProfileValidation.query.list,
    });
    // Define Routes
    this.router.post(
      "/",
      upload.single("logo"),
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
      upload.single("logo"),
      updateValidator,
      asyncHandler((req, res) => this.controller.update(req, res)),
    );
    this.router.put(
      "/:id",
      idValidator,
      updateValidator,
      asyncHandler((req, res) => this.controller.delete(req, res)),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
