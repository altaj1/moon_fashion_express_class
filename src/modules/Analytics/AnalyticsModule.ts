import { BaseModule } from '@/core/BaseModule';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRoutes } from './analytics.routes';

export class AnalyticsModule extends BaseModule {
    public readonly name = 'AnalyticsModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: AnalyticsService;
    private controller!: AnalyticsController;
    private routes!: AnalyticsRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new AnalyticsService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new AnalyticsController(this.service);
        this.routes = new AnalyticsRoutes(this.controller);

        this.router.use('/api/analyticss', this.routes.getRouter());
    }
}
