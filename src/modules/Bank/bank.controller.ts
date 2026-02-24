import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { BankService } from "./bank.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class BankController extends BaseController {
    constructor(private service: BankService) {
        super();
    }

    /**
     * Create Bank
     */
    public create = async (req: Request, res: Response) => {
        const body = req.validatedBody;
        const userId = req.userId;

        this.logAction("create", req, { body, userId });

        const result = await this.service.create({
            bankName: body.bankName,
            accountNumber: body.accountNumber,
            branchName: body.branchName,
            swiftCode: body.swiftCode,
            routingNumber: body.routingNumber,
            accountHeadId: body.accountHeadId,
            companyProfileId: body.companyProfileId
        });

        return this.sendCreatedResponse(
            res,
            result,
            "Bank created successfully",
        );
    };

    /**
     * Get All Banks (with query support)
     */
    public getAll = async (req: Request, res: Response) => {
        const query = req.validatedQuery || req.query;

        this.logAction("getAll", req, { query });

        const result = await this.service.getBanks(query);

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
            "Banks retrieved successfully",
            result.data,
        );
    };

    /**
     * Get Single Bank
     */
    public getOne = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;

        this.logAction("getOne", req, { id });

        const result = await this.service.findById(id);

        if (!result) {
            return this.sendResponse(
                res,
                "Bank not found",
                HTTPStatusCode.NOT_FOUND,
            );
        }

        return this.sendResponse(
            res,
            "Bank retrieved successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Update Bank
     */
    public update = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        const body = req.validatedBody;

        this.logAction("update", req, { id, body });

        const exists = await this.service.exists({ id });

        if (!exists) {
            return this.sendResponse(
                res,
                "Bank not found",
                HTTPStatusCode.NOT_FOUND,
            );
        }

        const result = await this.service.updateById(id, body);

        return this.sendResponse(
            res,
            "Bank updated successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Soft Delete Bank
     */
    public delete = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        const body = req.validatedBody;

        this.logAction("delete", req, { id });

        const exists = await this.service.exists({ id });

        if (!exists) {
            return this.sendResponse(
                res,
                "Bank not found",
                HTTPStatusCode.NOT_FOUND,
            );
        }

        await this.service.softDelete({
            id,
            isDeleted: body?.isDeleted ?? true,
        });

        return this.sendResponse(
            res,
            "Bank deleted successfully",
            HTTPStatusCode.OK,
        );
    };
}
