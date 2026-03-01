import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { ReceiptService } from "./receipt.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class ReceiptController extends BaseController {
    constructor(private service: ReceiptService) {
        super();
    }

    /**
     * Create Buyer Receipt
     */
    public createBuyerReceipt = async (req: Request, res: Response) => {
        const body = req.validatedBody;
        const userId = req.userId;

        this.logAction("createBuyerReceipt", req, { body, userId });

        const result = await this.service.createBuyerReceipt(body, userId as string);

        return this.sendCreatedResponse(
            res,
            result,
            "Buyer receipt recorded successfully as Journal Entry",
        );
    };

    /**
     * Get Receipts Data
     */
    public getReceipts = async (req: Request, res: Response) => {
        const query = req.validatedQuery || req.query;

        this.logAction("getReceipts", req, { query });

        const result = await this.service.getReceipts(query);

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
            "Receipts retrieved successfully",
            result.data,
        );
    };
}
