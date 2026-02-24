import { PrismaClient, JournalEntryStatus } from "@/generated/prisma/client";
import { LedgerListQueryDto, GeneralLedgerQueryDto } from "./ledger.validation";

export class LedgerService {
    constructor(private prisma: PrismaClient) { }

    // =========================================================================
    // Buyer Ledger (Computed from JournalLines)
    // =========================================================================
    public async getBuyerLedger(buyerId: string, query: LedgerListQueryDto) {
        const { page, limit, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        // Base filter: only POSTED entries for this specific buyer
        const baseWhere: any = {
            buyerId: buyerId,
            journalEntry: {
                status: JournalEntryStatus.POSTED,
            },
        };

        // Date range filter
        if (startDate || endDate) {
            baseWhere.journalEntry.date = {};
            if (startDate) baseWhere.journalEntry.date.gte = new Date(startDate);
            if (endDate) baseWhere.journalEntry.date.lte = new Date(endDate);
        }

        // 1. Get opening balance (sum of all transactions BEFORE the start date)
        let openingBalance = 0;
        if (startDate) {
            const priorLines = await this.prisma.journalLine.findMany({
                where: {
                    buyerId: buyerId,
                    journalEntry: {
                        status: JournalEntryStatus.POSTED,
                        date: { lt: new Date(startDate) },
                    },
                },
            });

            // Buyer is an ASSET. Debit increases balance (due), Credit decreases balance (paid).
            openingBalance = priorLines.reduce((acc, line) => {
                const amount = Number(line.amount);
                return acc + (line.type === "DEBIT" ? amount : -amount);
            }, 0);
        }

        // 2. Get paginated transactions within the period
        const totalLines = await this.prisma.journalLine.count({
            where: baseWhere,
        });

        const lines = await this.prisma.journalLine.findMany({
            where: baseWhere,
            skip,
            take: limit,
            orderBy: {
                journalEntry: {
                    date: "asc",
                },
            },
            include: {
                journalEntry: {
                    select: {
                        voucherNo: true,
                        date: true,
                        category: true,
                        narration: true,
                    }
                },
                accountHead: {
                    select: { name: true, type: true }
                }
            },
        });

        // 3. Compute running balance
        let runningBalance = openingBalance;
        const data = lines.map((line) => {
            const amount = Number(line.amount);
            const isDebit = line.type === "DEBIT";

            runningBalance += isDebit ? amount : -amount;

            return {
                id: line.id,
                date: line.journalEntry.date,
                voucherNo: line.journalEntry.voucherNo,
                category: line.journalEntry.category,
                narration: line.journalEntry.narration,
                accountName: line.accountHead.name,
                debit: isDebit ? amount : 0,
                credit: !isDebit ? amount : 0,
                balance: runningBalance,
            };
        });

        return {
            openingBalance,
            closingBalance: runningBalance,
            page,
            limit,
            total: totalLines,
            totalPages: Math.ceil(totalLines / limit),
            hasNext: page * limit < totalLines,
            hasPrevious: page > 1,
            data,
        };
    }

    // =========================================================================
    // Supplier Ledger (Computed from JournalLines)
    // =========================================================================
    public async getSupplierLedger(supplierId: string, query: LedgerListQueryDto) {
        const { page, limit, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        const baseWhere: any = {
            supplierId: supplierId,
            journalEntry: {
                status: JournalEntryStatus.POSTED,
            },
        };

        if (startDate || endDate) {
            baseWhere.journalEntry.date = {};
            if (startDate) baseWhere.journalEntry.date.gte = new Date(startDate);
            if (endDate) baseWhere.journalEntry.date.lte = new Date(endDate);
        }

        let openingBalance = 0;
        if (startDate) {
            const priorLines = await this.prisma.journalLine.findMany({
                where: {
                    supplierId: supplierId,
                    journalEntry: {
                        status: JournalEntryStatus.POSTED,
                        date: { lt: new Date(startDate) },
                    },
                },
            });

            // Supplier is a LIABILITY. Credit increases balance (due), Debit decreases balance (paid).
            openingBalance = priorLines.reduce((acc, line) => {
                const amount = Number(line.amount);
                return acc + (line.type === "CREDIT" ? amount : -amount);
            }, 0);
        }

        const totalLines = await this.prisma.journalLine.count({
            where: baseWhere,
        });

        const lines = await this.prisma.journalLine.findMany({
            where: baseWhere,
            skip,
            take: limit,
            orderBy: {
                journalEntry: {
                    date: "asc",
                },
            },
            include: {
                journalEntry: {
                    select: {
                        voucherNo: true,
                        date: true,
                        category: true,
                        narration: true,
                    }
                },
                accountHead: {
                    select: { name: true, type: true }
                }
            },
        });

        let runningBalance = openingBalance;
        const data = lines.map((line) => {
            const amount = Number(line.amount);
            const isCredit = line.type === "CREDIT";

            runningBalance += isCredit ? amount : -amount;

            return {
                id: line.id,
                date: line.journalEntry.date,
                voucherNo: line.journalEntry.voucherNo,
                category: line.journalEntry.category,
                narration: line.journalEntry.narration,
                accountName: line.accountHead.name,
                debit: !isCredit ? amount : 0,
                credit: isCredit ? amount : 0,
                balance: runningBalance,
            };
        });

        return {
            openingBalance,
            closingBalance: runningBalance,
            page,
            limit,
            total: totalLines,
            totalPages: Math.ceil(totalLines / limit),
            hasNext: page * limit < totalLines,
            hasPrevious: page > 1,
            data,
        };
    }

    // =========================================================================
    // Dashboard Audit Trail (Recent Journal Entries)
    // =========================================================================
    public async getAuditTrail(limit: number = 20) {
        return this.prisma.journalEntry.findMany({
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
                createdBy: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });
    }

    // =========================================================================
    // Dashboard Quick Stats
    // =========================================================================
    public async getDashboardStats() {
        // 1. Total Buyer Dues (sum of all Buyer balances)
        // 2. Total Supplier Dues (sum of all Supplier balances)
        // 3. Cash & Bank Balance (sum of all ASSET accounts linked to Bank/Cash)

        // For simplicity in Phase 1, we aggregate from AccountHeads
        const accounts = await this.prisma.accountHead.findMany();

        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;

        accounts.forEach(acc => {
            const balance = Number(acc.openingBalance || 0);
            switch (acc.type) {
                case 'ASSET': totalAssets += balance; break;
                case 'LIABILITY': totalLiabilities += balance; break;
                case 'INCOME': totalRevenue += balance; break;
                case 'EXPENSE': totalExpenses += balance; break;
            }
        });

        return {
            totalAssets,
            totalLiabilities,
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses
        };
    }
}
