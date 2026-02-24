import { PrismaClient } from "@/generated/prisma/client";
import { JournalEntryService } from "../JournalEntry/journalEntry.service";
import { CreateSupplierPaymentInput, PaymentListQueryDto } from "./payment.validation";

export class PaymentService {
    constructor(
        private prisma: PrismaClient,
        private journalService: JournalEntryService
    ) { }

    // =========================================================================
    // Supplier Payment (Creates Payment Record + Auto Journal)
    // =========================================================================
    public async createSupplierPayment(data: CreateSupplierPaymentInput, userId: string) {
        // 1. Validate Supplier exists
        const supplier = await this.prisma.supplier.findUnique({
            where: { id: data.supplierId }
        });

        if (!supplier) throw new Error("Supplier not found");

        // 2. Identify Account Heads
        // A real system links these explicitly in settings. We will look them up by name/type.
        const payableAccount = await this.prisma.accountHead.findFirst({
            where: { name: { contains: "Accounts Payable" }, type: "LIABILITY", isDeleted: false }
        });

        if (!payableAccount) throw new Error("System Error: 'Accounts Payable' account head not found");

        let assetAccountId: string;

        if (data.paymentMethod === "CASH") {
            const cashAccount = await this.prisma.accountHead.findFirst({
                where: { name: { contains: "Cash" }, type: "ASSET", isDeleted: false }
            });
            if (!cashAccount) throw new Error("System Error: Cash account head not found");
            assetAccountId = cashAccount.id;
        } else {
            // Bank or Cheque
            if (data.bankAccountId) {
                // Look up the specific bank's chart of account link
                const bank = await this.prisma.bank.findUnique({
                    where: { id: data.bankAccountId }
                });
                if (!bank || !bank.accountHeadId) throw new Error("Selected bank has no linked Account Head");
                assetAccountId = bank.accountHeadId;
            } else {
                // Fallback to general Bank account
                const bankAccount = await this.prisma.accountHead.findFirst({
                    where: { name: { contains: "Bank" }, type: "ASSET", isDeleted: false }
                });
                if (!bankAccount) throw new Error("System Error: General Bank account head not found");
                assetAccountId = bankAccount.id;
            }
        }

        // 3. Create Journal Entry (Payment to Supplier -> Dr Payable, Cr Bank/Cash)
        const journalEntry = await this.journalService.createDraft({
            date: new Date(data.date),
            category: "PAYMENT",
            narration: `Payment to ${supplier.name} via ${data.paymentMethod}${data.referenceId ? ' (Ref: ' + data.referenceId + ')' : ''}. ${data.remarks || ''}`,
            supplierId: supplier.id,
            userId: userId,
            lines: [
                {
                    accountHeadId: payableAccount.id,
                    type: "DEBIT", // Reducing liability
                    amount: data.amount
                },
                {
                    accountHeadId: assetAccountId,
                    type: "CREDIT", // Reducing asset
                    amount: data.amount
                }
            ]
        } as any);

        // If we had a dedicated Payment table (like PaymentReceipt), we would insert it here.
        // For now, the Journal Entry IS the source of truth for the payment.

        return journalEntry;
    }

    // =========================================================================
    // List Payments (Queries Journals of category PAYMENT)
    // =========================================================================
    public async getPayments(query: PaymentListQueryDto) {
        const { page, limit, supplierId, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        const baseWhere: any = {
            category: "PAYMENT",
        };

        if (supplierId) baseWhere.supplierId = supplierId;

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
                supplier: { select: { name: true } },
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
