import { BaseModule } from "@/core/BaseModule";
import { CompanyProfileService } from "./companyProfile.service";
import { CompanyProfileController } from "./companyProfile.controller";
import { CompanyProfileRoutes } from "./companyProfile.routes";

export class CompanyProfileModule extends BaseModule {
  public readonly name = "CompanyProfileModule";
  public readonly version = "1.0.0";
  // Add dependencies if this module relies on others
  public readonly dependencies = [];

  private service!: CompanyProfileService;
  private controller!: CompanyProfileController;
  private routes!: CompanyProfileRoutes;

  protected async setupServices(): Promise<void> {
    this.service = new CompanyProfileService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new CompanyProfileController(this.service);
    this.routes = new CompanyProfileRoutes(this.controller);

    this.router.use("/api/company-profiles", this.routes.getRouter());
  }
}
