import { BaseModule } from '@/core/BaseModule';
import { BuyerService } from './buyer.service';
import { BuyerController } from './buyer.controller';
import { BuyerRoutes } from './buyer.routes';

export class BuyerModule extends BaseModule {
    public readonly name = 'BuyerModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: BuyerService;
    private controller!: BuyerController;
    private routes!: BuyerRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new BuyerService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new BuyerController(this.service);
        this.routes = new BuyerRoutes(this.controller);

        this.router.use('/api/buyers', this.routes.getRouter());
    }
}
