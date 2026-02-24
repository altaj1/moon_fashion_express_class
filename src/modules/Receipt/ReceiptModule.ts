import { BaseModule } from "@/core/BaseModule";
import { ReceiptService } from "./receipt.service";
import { ReceiptController } from "./receipt.controller";
import { ReceiptRoutes } from "./receipt.routes";
import { JournalEntryService } from "../JournalEntry/journalEntry.service";

export class ReceiptModule extends BaseModule {
    public readonly name = "ReceiptModule";
    public readonly version = "1.0.0";
    public readonly dependencies = [];

    private service!: ReceiptService;
    private controller!: ReceiptController;
    private routes!: ReceiptRoutes;

    protected async setupServices(): Promise<void> {
        const journalService = new JournalEntryService(this.context.prisma);
        this.service = new ReceiptService(this.context.prisma, journalService);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new ReceiptController(this.service);
        this.routes = new ReceiptRoutes(this.controller);

        this.router.use("/api/accounting/receipts", this.routes.getRouter());
    }
}
