import { BaseModule } from '@/core/BaseModule';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceRoutes } from './invoice.routes';
import { JournalEntryService } from "../JournalEntry/journalEntry.service";

export class InvoiceModule extends BaseModule {
    public readonly name = 'InvoiceModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = [];

    private service!: InvoiceService;
    private controller!: InvoiceController;
    private routes!: InvoiceRoutes;

    protected async setupServices(): Promise<void> {
        const journalService = new JournalEntryService(this.context.prisma);
        this.service = new InvoiceService(journalService);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new InvoiceController(this.service);
        this.routes = new InvoiceRoutes(this.controller);

        this.router.use('/api/invoices', this.routes.getRouter());
    }
}
