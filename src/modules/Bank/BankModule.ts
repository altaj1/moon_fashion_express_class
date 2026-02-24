import { BaseModule } from "@/core/BaseModule";
import { BankService } from "./bank.service";
import { BankController } from "./bank.controller";
import { BankRoutes } from "./bank.routes";

export class BankModule extends BaseModule {
    public readonly name = "BankModule";
    public readonly version = "1.0.0";
    public readonly dependencies = [];

    private service!: BankService;
    private controller!: BankController;
    private routes!: BankRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new BankService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new BankController(this.service);
        this.routes = new BankRoutes(this.controller);

        this.router.use("/api/accounting/banks", this.routes.getRouter());
    }
}
