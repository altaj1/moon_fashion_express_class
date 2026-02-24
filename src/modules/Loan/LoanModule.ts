import { BaseModule } from "@/core/BaseModule";
import { LoanService } from "./loan.service";
import { LoanController } from "./loan.controller";
import { LoanRoutes } from "./loan.routes";
import { JournalEntryService } from "../JournalEntry/journalEntry.service";

export class LoanModule extends BaseModule {
    public readonly name = "LoanModule";
    public readonly version = "1.0.0";
    public readonly dependencies = [];

    private service!: LoanService;
    private controller!: LoanController;
    private routes!: LoanRoutes;

    protected async setupServices(): Promise<void> {
        const journalService = new JournalEntryService(this.context.prisma);
        this.service = new LoanService(this.context.prisma, journalService);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new LoanController(this.service);
        this.routes = new LoanRoutes(this.controller);

        this.router.use("/api/accounting/loans", this.routes.getRouter());
    }
}
