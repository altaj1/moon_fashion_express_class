import { Request, Response } from 'express';
import { BaseController } from '@/core/BaseController';
import { LCManagementService } from './lCManagement.service';
import { HTTPStatusCode } from '@/types/HTTPStatusCode';

export class LCManagementController extends BaseController {
    constructor(private service: LCManagementService) {
        super();
    }

    /**
     * Create a new LCManagement
     */
    public create = async (req: Request, res: Response) => {
        const body = req.validatedBody;
        this.logAction('create', req, { body });
        
        const result = await this.service.create(body);
        
        return this.sendCreatedResponse(res, result, 'LCManagement created successfully');
    };

    /**
     * Get all LCManagements
     */
    public getAll = async (req: Request, res: Response) => {
        const pagination = this.extractPaginationParams(req);
        this.logAction('getAll', req, { pagination });

        const result = await this.service.findMany({}, pagination);

        return this.sendPaginatedResponse(
            res, 
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.hasNext,
                hasPrevious: result.hasPrevious
            }, 
            'LCManagements retrieved successfully', 
            result.data
        );
    };

    /**
     * Get single LCManagement
     */
    public getOne = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        this.logAction('getOne', req, { id });

        const result = await this.service.findById(id);

        if (!result) {
            return this.sendResponse(res, 'LCManagement not found', HTTPStatusCode.NOT_FOUND);
        }

        return this.sendResponse(res, 'LCManagement retrieved successfully', HTTPStatusCode.OK, result);
    };

    /**
     * Update LCManagement
     */
    public update = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        const body = req.validatedBody;
        this.logAction('update', req, { id, body });
        
        const exists = await this.service.exists({ id });
        if (!exists) {
            return this.sendResponse(res, 'LCManagement not found', HTTPStatusCode.NOT_FOUND);
        }

        const result = await this.service.updateById(id, body);
        
        return this.sendResponse(res, 'LCManagement updated successfully', HTTPStatusCode.OK, result);
    };

    /**
     * Delete LCManagement
     */
    public delete = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        this.logAction('delete', req, { id });
        
        const exists = await this.service.exists({ id });
        if (!exists) {
            return this.sendResponse(res, 'LCManagement not found', HTTPStatusCode.NOT_FOUND);
        }

        await this.service.deleteById(id);
        
        return this.sendResponse(res, 'LCManagement deleted successfully', HTTPStatusCode.OK);
    };
}
