import { BaseModule } from "@/core/BaseModule";
import { FinancialReportService } from "./financialReport.service";
import { FinancialReportController } from "./financialReport.controller";
import { FinancialReportRoutes } from "./financialReport.routes";

export class FinancialReportModule extends BaseModule {
    public readonly name = "FinancialReportModule";
    public readonly version = "1.0.0";
    public readonly dependencies = [];

    private service!: FinancialReportService;
    private controller!: FinancialReportController;

    protected async setupServices(): Promise<void> {
        this.service = new FinancialReportService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new FinancialReportController(this.service);
        const routes = new FinancialReportRoutes(this.controller);

        this.router.use("/api/financial-reports", routes.getRouter());
    }
}
