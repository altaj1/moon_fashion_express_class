import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { PaymentService } from "./payment.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class PaymentController extends BaseController {
    constructor(private service: PaymentService) {
        super();
    }

    /**
     * Create Supplier Payment
     */
    public createSupplierPayment = async (req: Request, res: Response) => {
        const body = req.validatedBody;
        const userId = req.userId;

        this.logAction("createSupplierPayment", req, { body, userId });

        const result = await this.service.createSupplierPayment(body, userId as string);

        return this.sendCreatedResponse(
            res,
            result,
            "Supplier payment recorded successfully as Journal Entry",
        );
    };

    /**
     * Get Payments Data
     */
    public getPayments = async (req: Request, res: Response) => {
        const query = req.validatedQuery || req.query;

        this.logAction("getPayments", req, { query });

        const result = await this.service.getPayments(query);

        return this.sendPaginatedResponse(
            res,
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.hasNext,
                hasPrevious: result.hasPrevious,
            },
            "Payments retrieved successfully",
            result.data,
        );
    };
}
