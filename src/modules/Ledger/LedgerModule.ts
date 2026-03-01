import { BaseModule } from "@/core/BaseModule";
import { LedgerService } from "./ledger.service";
import { LedgerController } from "./ledger.controller";
import { LedgerRoutes } from "./ledger.routes";

export class LedgerModule extends BaseModule {
    public readonly name = "LedgerModule";
    public readonly version = "1.0.0";
    public readonly dependencies = [];

    private service!: LedgerService;
    private controller!: LedgerController;
    private routes!: LedgerRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new LedgerService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new LedgerController(this.service);
        this.routes = new LedgerRoutes(this.controller);

        this.router.use("/api/accounting/ledger", this.routes.getRouter());
    }
}
