import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { LoanService } from "./loan.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class LoanController extends BaseController {
    constructor(private service: LoanService) {
        super();
    }

    /**
     * Create Loan
     */
    public create = async (req: Request, res: Response) => {
        const body = req.validatedBody;
        const userId = req.userId;

        this.logAction("create", req, { body, userId });

        const result = await this.service.create({
            ...body,
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : undefined,
        }, userId as string);

        return this.sendCreatedResponse(res, result, "Loan created successfully");
    };

    /**
     * Get All Loans (with query support)
     */
    public getAll = async (req: Request, res: Response) => {
        const query = req.validatedQuery || req.query;

        this.logAction("getAll", req, { query });

        const result = await this.service.getLoans(query);

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
            "Loans retrieved successfully",
            result.data,
        );
    };

    /**
     * Get Single Loan
     */
    public getOne = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;

        this.logAction("getOne", req, { id });

        const result = await this.service.findById(id, {
            repayments: true,
            companyProfile: {
                select: { name: true },
            },
        });

        if (!result) {
            return this.sendResponse(res, "Loan not found", HTTPStatusCode.NOT_FOUND);
        }

        return this.sendResponse(
            res,
            "Loan retrieved successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Update Loan
     */
    public update = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        const body = req.validatedBody;

        this.logAction("update", req, { id, body });

        const exists = await this.service.exists({ id });

        if (!exists) {
            return this.sendResponse(res, "Loan not found", HTTPStatusCode.NOT_FOUND);
        }

        const updateData = { ...body };
        if (body.startDate) updateData.startDate = new Date(body.startDate);
        if (body.endDate) updateData.endDate = new Date(body.endDate);

        const result = await this.service.updateById(id, updateData);

        return this.sendResponse(
            res,
            "Loan updated successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Soft Delete Loan
     */
    public delete = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        const body = req.validatedBody;

        this.logAction("delete", req, { id });

        const exists = await this.service.exists({ id });

        if (!exists) {
            return this.sendResponse(res, "Loan not found", HTTPStatusCode.NOT_FOUND);
        }

        await this.service.softDelete({
            id,
            isDeleted: body?.isDeleted ?? true,
        });

        return this.sendResponse(
            res,
            "Loan deleted successfully",
            HTTPStatusCode.OK,
        );
    };

    // =========================
    // Repayments
    // =========================

    /**
     * Record Loan Repayment
     */
    public recordRepayment = async (req: Request, res: Response) => {
        const { id } = req.validatedParams; // loan Id
        const body = req.validatedBody;

        this.logAction("recordRepayment", req, { id, body });

        const result = await this.service.recordRepayment(id, body);

        return this.sendCreatedResponse(
            res,
            result,
            "Loan repayment recorded successfully",
        );
    };

    /**
     * Get Loan Repayments
     */
    public getRepayments = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;

        this.logAction("getRepayments", req, { id });

        const result = await this.service.getLoanRepayments(id);

        return this.sendResponse(
            res,
            "Repayments retrieved successfully",
            HTTPStatusCode.OK,
            result,
        );
    };
}
