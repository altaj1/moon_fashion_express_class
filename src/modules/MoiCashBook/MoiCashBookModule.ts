import { BaseModule } from "@/core/BaseModule";
import { MoiCashBookService } from "./moiCashBook.service";
import { MoiCashBookController } from "./moiCashBook.controller";
import { MoiCashBookRoutes } from "./moiCashBook.routes";

export class MoiCashBookModule extends BaseModule {
  public readonly name = "MoiCashBookModule";
  public readonly version = "1.0.0";
  // Add dependencies if this module relies on others
  public readonly dependencies = [];

  private service!: MoiCashBookService;
  private controller!: MoiCashBookController;
  private routes!: MoiCashBookRoutes;

  protected async setupServices(): Promise<void> {
    this.service = new MoiCashBookService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new MoiCashBookController(this.service);
    this.routes = new MoiCashBookRoutes(this.controller);

    this.router.use("/api/moi-cash-books", this.routes.getRouter());
  }
}
