import { BaseModule } from '@/core/BaseModule';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderRoutes } from './order.routes';

export class OrderModule extends BaseModule {
    public readonly name = 'OrderModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: OrderService;
    private controller!: OrderController;
    private routes!: OrderRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new OrderService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new OrderController(this.service);
        this.routes = new OrderRoutes(this.controller);

        this.router.use('/api/orders', this.routes.getRouter());
    }
}
