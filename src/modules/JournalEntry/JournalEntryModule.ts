import { BaseModule } from "@/core/BaseModule";
import { JournalEntryService } from "./journalEntry.service";
import { JournalEntryController } from "./journalEntry.controller";
import { JournalEntryRoutes } from "./journalEntry.routes";

export class JournalEntryModule extends BaseModule {
  public readonly name = "JournalEntryModule";
  public readonly version = "1.0.0";
  // Add dependencies if this module relies on others
  public readonly dependencies = [];

  private service!: JournalEntryService;
  private controller!: JournalEntryController;
  private routes!: JournalEntryRoutes;

  protected async setupServices(): Promise<void> {
    this.service = new JournalEntryService(this.context.prisma);
  }

  protected async setupRoutes(): Promise<void> {
    this.controller = new JournalEntryController(this.service);
    this.routes = new JournalEntryRoutes(this.controller);

    this.router.use("/api/accounting/journal-entries", this.routes.getRouter());
  }
}
