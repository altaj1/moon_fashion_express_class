import { Router, Request, Response } from 'express';
import { OrderController } from './order.controller';
import { OrderValidation } from './order.validation';
import { validateRequest } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/asyncHandler';

export class OrderRoutes {
    private router: Router;
    private controller: OrderController;

    constructor(controller: OrderController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        const createValidator = validateRequest({ body: OrderValidation.create });
        const updateValidator = validateRequest({ 
            params: OrderValidation.params.id, 
            body: OrderValidation.update 
        });
        const idValidator = validateRequest({ params: OrderValidation.params.id });

        // Define Routes
        this.router.post('/', createValidator, asyncHandler((req, res) => this.controller.create(req, res)));
        this.router.get('/', asyncHandler((req, res) => this.controller.getAll(req, res)));
        this.router.get('/:id', idValidator, asyncHandler((req, res) => this.controller.getOne(req, res)));
        this.router.patch('/:id', updateValidator, asyncHandler((req, res) => this.controller.update(req, res)));
        this.router.delete('/:id', idValidator, asyncHandler((req, res) => this.controller.delete(req, res)));
    }

    public getRouter(): Router {
        return this.router;
    }
}
