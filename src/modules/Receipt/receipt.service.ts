import { PrismaClient } from "@/generated/prisma/client";
import { JournalEntryService } from "../JournalEntry/journalEntry.service";
import { CreateBuyerReceiptInput, ReceiptListQueryDto } from "./receipt.validation";

export class ReceiptService {
    constructor(
        private prisma: PrismaClient,
        private journalService: JournalEntryService
    ) { }

    // =========================================================================
    // Buyer Receipt (Creates Receipt Record + Auto Journal)
    // =========================================================================
    public async createBuyerReceipt(data: CreateBuyerReceiptInput, userId: string) {
        // 1. Validate Buyer exists
        const buyer = await this.prisma.buyer.findUnique({
            where: { id: data.buyerId }
        });

        if (!buyer) throw new Error("Buyer not found");

        // 2. Identify Account Heads
        let receivableAccountId = data.receivableAccountId;
        if (!receivableAccountId) {
            const receivableAccount = await this.prisma.accountHead.findFirst({
                where: { name: { contains: "Accounts Receivable" }, type: "ASSET", isDeleted: false }
            });
            if (!receivableAccount) throw new Error("System Error: 'Accounts Receivable' account head not found");
            receivableAccountId = receivableAccount.id;
        }

        let bankIdForLine: string | undefined;
        let assetAccountId: string;

        if (data.assetAccountId) {
            assetAccountId = data.assetAccountId;
        } else if (data.paymentMethod === "CASH") {
            const cashAccount = await this.prisma.accountHead.findFirst({
                where: { name: { contains: "Cash" }, type: "ASSET", isDeleted: false }
            });
            if (!cashAccount) throw new Error("System Error: Cash account head not found");
            assetAccountId = cashAccount.id;
        } else {
            // Bank or Cheque
            const bankAccount = await this.prisma.accountHead.findFirst({
                where: { name: { contains: "Bank" }, type: "ASSET", isDeleted: false }
            });
            if (!bankAccount) throw new Error("System Error: General Bank account head not found");
            assetAccountId = bankAccount.id;

            if (data.bankAccountId) {
                const bank = await this.prisma.bank.findUnique({
                    where: { id: data.bankAccountId }
                });
                if (!bank) throw new Error("Selected bank not found");
                bankIdForLine = bank.id;
            }
        }

        // 3. Create Journal Entry (Receipt from Buyer -> Dr Bank/Cash, Cr Receivable)
        const journalEntry = await this.journalService.createDraft({
            date: new Date(data.date),
            category: "RECEIPT",
            narration: `Payment received from ${buyer.name} via ${data.paymentMethod}${data.referenceId ? ' (Ref: ' + data.referenceId + ')' : ''}. ${data.remarks || ''}`,
            buyerId: buyer.id,
            userId: userId,
            lines: [
                {
                    accountHeadId: assetAccountId,
                    type: "DEBIT", // Increasing asset (Bank/Cash)
                    amount: data.amount,
                    bankId: bankIdForLine,
                },
                {
                    accountHeadId: receivableAccountId,
                    type: "CREDIT", // Reducing asset (Receivable)
                    amount: data.amount
                }
            ]
        } as any);

        // 4. Auto-post the entry (receipts are always balanced)
        await this.journalService.postEntry(journalEntry.id);

        return journalEntry;
    }

    // =========================================================================
    // List Receipts (Queries Journals of category RECEIPT)
    // =========================================================================
    public async getReceipts(query: ReceiptListQueryDto) {
        const { page, limit, buyerId, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        const baseWhere: any = {
            category: "RECEIPT",
            // Exclude loan receipts (which don't have a buyerId)
            buyerId: { not: null }
        };

        if (buyerId) baseWhere.buyerId = buyerId;

        if (startDate || endDate) {
            baseWhere.date = {};
            if (startDate) baseWhere.date.gte = new Date(startDate);
            if (endDate) baseWhere.date.lte = new Date(endDate);
        }

        const total = await this.prisma.journalEntry.count({ where: baseWhere });
        const data = await this.prisma.journalEntry.findMany({
            where: baseWhere,
            skip,
            take: limit,
            orderBy: { date: "desc" },
            include: {
                buyer: { select: { name: true } },
                lines: {
                    include: { accountHead: { select: { name: true } } }
                }
            }
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
}
