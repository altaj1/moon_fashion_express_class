import { BaseModule } from "@/core/BaseModule";
import { InvoiceTermsService } from "./invoiceTerms.service";
import { InvoiceTermsController } from "./invoiceTerms.controller";
import { InvoiceTermsRoutes } from "./invoiceTerms.routes";

export class InvoiceTermsModule extends BaseModule {
  public readonly name = "InvoiceTermsModule";
  public readonly version = "1.0.0";
  // Add dependencies if this module relies on others
  public readonly dependencies = [];

  private service!: InvoiceTermsService;
  private controller!: InvoiceTermsController;
  private routes!: InvoiceTermsRoutes;

  protected async setupServices(): Promise<void> {
    this.service = new InvoiceTermsService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new InvoiceTermsController(this.service);
    this.routes = new InvoiceTermsRoutes(this.controller);

    this.router.use("/api/invoice-terms", this.routes.getRouter());
  }
}
