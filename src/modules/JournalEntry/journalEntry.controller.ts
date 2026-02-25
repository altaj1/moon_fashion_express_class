import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { JournalEntryService } from "./journalEntry.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class JournalEntryController extends BaseController {
    constructor(private service: JournalEntryService) {
        super();
    }

    /**
     * Create Journal Entry (always starts as DRAFT)
     */
    public create = async (req: Request, res: Response) => {
        const body = req.validatedBody;

        this.logAction("create", req, { body });

        const result = await this.service.createDraft({
            ...body,
            createdById: req.userId
        });

        // ❌ Previously used generic `this.service.create(body)` which skipped journal line creation.
        //    Now using `createDraft()` which properly creates the entry + lines in a transaction.

        return this.sendCreatedResponse(
            res,
            result,
            "Journal entry created as DRAFT",
        );
    };

    /**
     * Get All Journal Entries (with query support)
     */
    public getAll = async (req: Request, res: Response) => {
        const pagination = this.extractPaginationParams(req);
        const query = req.validatedQuery || req.query;
        const { search, category, status } = query;

        this.logAction("getAll", req, { pagination });

        const filters: any = {};
        if (category) {
            filters.category = category;
        }
        if (status) {
            filters.status = status;
        }
        if (search) {
            filters.OR = [
                { voucherNo: { contains: search, mode: "insensitive" } },
                { narration: { contains: search, mode: "insensitive" } },
            ];
        }

        const result = await this.service.findMany(filters, pagination, undefined, {
            lines: { include: { accountHead: true } },
            buyer: true,
            supplier: true,
            createdBy: true,
        });

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
            "Journal entries retrieved successfully",
            result.data,
        );
    };

    /**
     * Get Single Journal Entry
     */
    public getOne = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;

        this.logAction("getOne", req, { id });

        const result = await this.service.findById(id, {
            lines: { include: { accountHead: true } },
            buyer: true,
            supplier: true,
            createdBy: true,
        });

        if (!result) {
            return this.sendResponse(
                res,
                "Journal entry not found",
                HTTPStatusCode.NOT_FOUND,
            );
        }

        return this.sendResponse(
            res,
            "Journal entry retrieved successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Update Journal Entry (DRAFT only)
     */
    public update = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;
        const body = req.validatedBody;

        this.logAction("update", req, { id, body });

        const existing = await this.service.findById(id);

        if (!existing) {
            return this.sendResponse(
                res,
                "Journal entry not found",
                HTTPStatusCode.NOT_FOUND,
            );
        }

        // ✅ Accounting Rule: Only DRAFT entries can be modified.
        //    Posted entries must be reversed instead.
        if (existing.status === "POSTED") {
            return this.sendResponse(
                res,
                "Cannot modify a POSTED entry. Use reversal instead.",
                HTTPStatusCode.BAD_REQUEST,
            );
        }

        const result = await this.service.updateById(id, body);

        return this.sendResponse(
            res,
            "Journal entry updated successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * Delete Journal Entry (DRAFT only)
     */
    public delete = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;

        this.logAction("delete", req, { id });

        const existing = await this.service.findById(id);

        if (!existing) {
            return this.sendResponse(
                res,
                "Journal entry not found",
                HTTPStatusCode.NOT_FOUND,
            );
        }

        // ✅ Accounting Rule: Only DRAFT entries can be deleted.
        //    Posted entries must never be deleted — use reversal instead.
        if (existing.status === "POSTED") {
            return this.sendResponse(
                res,
                "Cannot delete a POSTED entry. Use reversal instead.",
                HTTPStatusCode.BAD_REQUEST,
            );
        }

        await this.service.deleteById(id);

        return this.sendResponse(
            res,
            "Draft journal entry deleted successfully",
            HTTPStatusCode.OK,
        );
    };

    // =========================================================================
    // Accounting Action Endpoints
    // =========================================================================

    /**
     * POST a Journal Entry
     * Validates debit=credit, updates account balances, locks entry from editing.
     */
    public post = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;

        this.logAction("post", req, { id });

        const result = await this.service.postEntry(id);

        return this.sendResponse(
            res,
            "Journal entry posted successfully",
            HTTPStatusCode.OK,
            result,
        );
    };

    /**
     * REVERSE a Journal Entry
     * Creates a counter-entry with flipped debits/credits.
     * Used instead of deleting posted entries (accounting principle).
     */
    public reverse = async (req: Request, res: Response) => {
        const { id } = req.validatedParams;

        this.logAction("reverse", req, { id });

        const result = await this.service.reverseEntry(id);

        return this.sendResponse(
            res,
            "Journal entry reversed successfully",
            HTTPStatusCode.OK,
            result,
        );
    };
}
