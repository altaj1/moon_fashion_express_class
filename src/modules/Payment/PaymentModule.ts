import { BaseModule } from "@/core/BaseModule";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { PaymentRoutes } from "./payment.routes";
import { JournalEntryService } from "../JournalEntry/journalEntry.service";

export class PaymentModule extends BaseModule {
    public readonly name = "PaymentModule";
    public readonly version = "1.0.0";
    public readonly dependencies = [];

    private service!: PaymentService;
    private controller!: PaymentController;
    private routes!: PaymentRoutes;

    protected async setupServices(): Promise<void> {
        const journalService = new JournalEntryService(this.context.prisma);
        this.service = new PaymentService(this.context.prisma, journalService);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new PaymentController(this.service);
        this.routes = new PaymentRoutes(this.controller);

        this.router.use("/api/accounting/payments", this.routes.getRouter());
    }
}
