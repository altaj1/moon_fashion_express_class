import { BaseModule } from "@/core/BaseModule";
import { AccountHeadService } from "./accountHead.service";
import { AccountHeadController } from "./accountHead.controller";
import { AccountHeadRoutes } from "./accountHead.routes";

export class AccountHeadModule extends BaseModule {
  public readonly name = "AccountHeadModule";
  public readonly version = "1.0.0";
  // Add dependencies if this module relies on others
  public readonly dependencies = [];

  private service!: AccountHeadService;
  private controller!: AccountHeadController;
  private routes!: AccountHeadRoutes;

  protected async setupServices(): Promise<void> {
    this.service = new AccountHeadService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new AccountHeadController(this.service);
    this.routes = new AccountHeadRoutes(this.controller);

    this.router.use("/api/accounting/accountHeads", this.routes.getRouter());
  }
}
