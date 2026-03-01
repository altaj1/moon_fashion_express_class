import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { JournalEntryService } from "../JournalEntry/journalEntry.service";
import {
    CreateLoanInput,
    UpdateLoanInput,
    ListLoanQueryDto,
    CreateLoanRepaymentInput,
} from "./loan.validation";

export class LoanService extends BaseService<
    any,
    CreateLoanInput,
    UpdateLoanInput
> {
    constructor(
        prisma: PrismaClient,
        private journalService?: JournalEntryService
    ) {
        super(prisma, "Loan", {
            enableSoftDelete: true,
            enableAuditFields: true,
        });
    }

    protected getModel() {
        // @ts-ignore
        return this.prisma.loan;
    }

    // =========================================================================
    // Public API
    // =========================================================================

    public async create(data: CreateLoanInput, userId: string, include?: any) {
        // Find default company profile if not provided
        if (!data.companyProfileId) {
            const defaultProfile = await this.prisma.companyProfile.findFirst({
                where: { isDeleted: false }
            });
            if (defaultProfile) {
                data.companyProfileId = defaultProfile.id;
            } else {
                throw new Error("No active company profile found to associate with this loan.");
            }
        }

        const result = await super.create(data, include);

        // =========================================================
        // Auto-create Journal Entry (Loan Received)
        // =========================================================
        if (this.journalService) {
            try {
                // Find standard account heads for Bank and Loan Payable
                // Professional Tip: In a real system, these should be mapped in settings.
                const bankAccount = await this.prisma.accountHead.findFirst({
                    where: {
                        OR: [
                            { name: { contains: "Bank", mode: "insensitive" } },
                            { name: { contains: "Cash", mode: "insensitive" } }
                        ],
                        type: "ASSET",
                        isDeleted: false
                    }
                });
                const loanPayableAccount = await this.prisma.accountHead.findFirst({
                    where: {
                        OR: [
                            { name: { contains: "Bank Loan", mode: "insensitive" } },
                            { name: { contains: "Loan Payable", mode: "insensitive" } }
                        ],
                        type: "LIABILITY",
                        isDeleted: false
                    }
                });

                if (bankAccount && loanPayableAccount) {
                    await this.journalService.createDraft({
                        date: new Date(data.startDate),
                        category: "RECEIPT",
                        narration: `[Auto] Loan Disbursed: ${data.lenderName} (${data.loanType || "General"})`,
                        userId: userId,
                        lines: [
                            {
                                accountHeadId: bankAccount.id,
                                type: "DEBIT",
                                amount: data.principalAmount
                            },
                            {
                                accountHeadId: loanPayableAccount.id,
                                type: "CREDIT",
                                amount: data.principalAmount
                            }
                        ]
                    } as any);
                }
            } catch (err) {
                console.error("Failed to auto-create journal entry for Loan:", err);
            }
        }

        return result;
    }

    // =========================================================
    // GET ALL LOANS (Search + Pagination + Sort)
    // =========================================================
    public async getLoans(query: ListLoanQueryDto) {
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
                { lenderName: { contains: search, mode: "insensitive" } },
                { remarks: { contains: search, mode: "insensitive" } },
                { loanType: { contains: search, mode: "insensitive" } },
            ];
        }

        filters = {
            ...filters,
            ...rest,
        };

        const skip = (page - 1) * limit;

        const total = await this.prisma.loan.count({
            where: filters,
        });

        const data = await this.prisma.loan.findMany({
            where: filters,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                repayments: true,
            },
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
        data: UpdateLoanInput,
        include?: any,
    ) {
        return super.updateById(id, data, include);
    }

    public async softDelete(data: any): Promise<any> {
        const { id, isDeleted } = data;

        return super.updateById(id, {
            isDeleted,
        });
    }

    public async exists(filters: any) {
        return super.exists(filters);
    }

    // =========================================================
    // Loan Repayments
    // =========================================================

    public async recordRepayment(loanId: string, data: CreateLoanRepaymentInput, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Get the loan to check remaining balance
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                include: { repayments: true },
            });

            if (!loan) throw new Error("Loan not found");

            // 2. Calculate remaining balance
            const totalPaidPrincipal = loan.repayments.reduce(
                (sum, rep) => sum + Number(rep.principal),
                0
            );

            const newRemainingBalance = Number(loan.principalAmount) - totalPaidPrincipal - data.principal;

            if (newRemainingBalance < 0) {
                throw new Error("Repayment principal exceeds current loan balance");
            }

            // 3. Create the repayment record
            // NOTE: Auto-journal creation for this repayment will be added in Step 4.
            // We keep the logic isolated for now until the ledger mapping is set up.
            const repayment = await tx.loanRepayment.create({
                data: {
                    loanId,
                    installmentNo: data.installmentNo,
                    date: new Date(data.date),
                    principal: data.principal,
                    interest: data.interest,
                    totalPaid: data.principal + data.interest,
                    remainingBalance: newRemainingBalance,
                },
            });

            // =========================================================
            // Auto-create Journal Entry (Loan Repayment)
            // =========================================================
            if (this.journalService) {
                try {
                    const bankAccount = await tx.accountHead.findFirst({
                        where: {
                            OR: [
                                { name: { contains: "Bank", mode: "insensitive" } },
                                { name: { contains: "Cash", mode: "insensitive" } }
                            ],
                            type: "ASSET",
                            isDeleted: false
                        }
                    });
                    const loanPayableAccount = await tx.accountHead.findFirst({
                        where: {
                            OR: [
                                { name: { contains: "Bank Loan", mode: "insensitive" } },
                                { name: { contains: "Loan Payable", mode: "insensitive" } }
                            ],
                            type: "LIABILITY",
                            isDeleted: false
                        }
                    });
                    const interestExpenseAccount = await tx.accountHead.findFirst({
                        where: {
                            OR: [
                                { name: { contains: "Interest", mode: "insensitive" } },
                                { name: { contains: "Finance Cost", mode: "insensitive" } }
                            ],
                            type: "EXPENSE",
                            isDeleted: false
                        }
                    });

                    if (bankAccount && loanPayableAccount && interestExpenseAccount) {
                        const lines = [];

                        // 1. Decrease Liability (Dr Principal)
                        if (data.principal > 0) {
                            lines.push({
                                accountHeadId: loanPayableAccount.id,
                                type: "DEBIT",
                                amount: data.principal
                            });
                        }

                        // 2. Increase Expense (Dr Interest)
                        if (data.interest > 0) {
                            lines.push({
                                accountHeadId: interestExpenseAccount.id,
                                type: "DEBIT",
                                amount: data.interest
                            });
                        }

                        // 3. Decrease Asset (Cr Total Bank)
                        lines.push({
                            accountHeadId: bankAccount.id,
                            type: "CREDIT",
                            amount: data.principal + data.interest
                        });

                        await this.journalService.createDraft({
                            date: new Date(data.date),
                            category: "PAYMENT", // Paying back loan is a payment
                            narration: `Repayment for Loan ${loan.lenderName} (Installment ${data.installmentNo})`,
                            userId: userId, // Correctly passed from controller
                            lines
                        } as any);
                    }
                } catch (err) {
                    console.error("Failed to auto-create journal entry for Loan Repayment:", err);
                }
            }

            return repayment;
        });
    }

    public async getLoanRepayments(loanId: string) {
        return this.prisma.loanRepayment.findMany({
            where: { loanId },
            orderBy: { installmentNo: "asc" },
        });
    }
}
