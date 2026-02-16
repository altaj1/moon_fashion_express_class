import { BaseModule } from "@/core/BaseModule";
import { LCManagementService } from "./lCManagement.service";
import { LCManagementController } from "./lCManagement.controller";
import { LCManagementRoutes } from "./lCManagement.routes";

export class LCManagementModule extends BaseModule {
  public readonly name = "LCManagementModule";
  public readonly version = "1.0.0";
  // Add dependencies if this module relies on others
  public readonly dependencies = [];

  private service!: LCManagementService;
  private controller!: LCManagementController;
  private routes!: LCManagementRoutes;

  protected async setupServices(): Promise<void> {
    this.service = new LCManagementService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new LCManagementController(this.service);
    this.routes = new LCManagementRoutes(this.controller);

    this.router.use("/api/lc-managements", this.routes.getRouter());
  }
}
