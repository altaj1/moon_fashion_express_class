import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import {
    CreateBankInput,
    UpdateBankInput,
    ListBankQueryDto,
} from "./bank.validation";

export class BankService extends BaseService<
    any,
    CreateBankInput,
    UpdateBankInput
> {
    constructor(prisma: PrismaClient) {
        super(prisma, "Bank", {
            enableSoftDelete: true,
            enableAuditFields: true,
        });
    }

    protected getModel() {
        // @ts-ignore
        return this.prisma.bank;
    }

    // =========================================================================
    // Public API
    // =========================================================================

    public async create(data: CreateBankInput, include?: any) {
        return super.create(data, include);
    }

    // =========================================================
    // GET ALL BANKS (Search + Pagination + Sort)
    // =========================================================
    public async getBanks(query: ListBankQueryDto) {
        const {
            page,
            limit,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
            ...rest
        } = query;

        let filters: any = {};

        if (search) {
            filters.OR = [
                { bankName: { contains: search, mode: "insensitive" } },
                { accountNumber: { contains: search, mode: "insensitive" } },
                { branchName: { contains: search, mode: "insensitive" } },
            ];
        }

        filters = {
            ...filters,
            ...rest,
        };

        const skip = (page - 1) * limit;

        const total = await this.prisma.bank.count({
            where: filters,
        });

        const banks = await this.prisma.bank.findMany({
            where: filters,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
        });

        // ── Real-Time Balance Aggregation ───────────────────────────
        const bankIds = banks.map(b => b.id);
        const balances = await this.prisma.journalLine.groupBy({
            by: ['bankId', 'type'],
            where: {
                bankId: { in: bankIds },
                journalEntry: { status: 'POSTED' } // Only count confirmed transactions
            },
            _sum: {
                amount: true
            }
        });

        const data = banks.map(bank => {
            const bankBalances = balances.filter(b => b.bankId === bank.id);
            const debits = Number(bankBalances.find(b => b.type === 'DEBIT')?._sum?.amount || 0);
            const credits = Number(bankBalances.find(b => b.type === 'CREDIT')?._sum?.amount || 0);

            return {
                ...bank,
                balance: debits - credits
            };
        });

        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrevious: page > 1,
            data,
        };
    }

    public async findById(id: string, include?: any) {
        return super.findById(id, include);
    }

    public async updateById(
        id: string,
        data: UpdateBankInput,
        include?: any,
    ) {
        return super.updateById(id, data, include);
    }

    // Soft Delete
    public async softDelete(data: any): Promise<any> {
        const { id, isDeleted } = data;

        return super.updateById(id, {
            isDeleted,
        });
    }

    public async exists(filters: any) {
        return super.exists(filters);
    }
}
