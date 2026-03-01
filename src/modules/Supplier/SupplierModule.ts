import { BaseModule } from '@/core/BaseModule';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { SupplierRoutes } from './supplier.routes';

export class SupplierModule extends BaseModule {
    public readonly name = 'SupplierModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: SupplierService;
    private controller!: SupplierController;
    private routes!: SupplierRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new SupplierService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new SupplierController(this.service);
        this.routes = new SupplierRoutes(this.controller);

        this.router.use('/api/suppliers', this.routes.getRouter());
    }
}
