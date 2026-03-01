import { PrismaClient, AccountType, JournalEntryType } from "@/generated/prisma/client";

export interface TrialBalanceEntry {
    accountId: string;
    accountName: string;
    accountCode: string | null;
    accountType: AccountType;
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
}

export class FinancialReportService {
    constructor(private prisma: PrismaClient) { }

    public async getTrialBalance(startDate: string, endDate: string) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // 1. Get all active account heads
        const accounts = await this.prisma.accountHead.findMany({
            where: { isDeleted: false },
            orderBy: { name: "asc" },
        });

        const report: TrialBalanceEntry[] = [];

        for (const account of accounts) {
            // 2. Calculate Opening Balance (sum of all POSTED entries before startDate)
            // Note: We include the Account's initial openingBalance if it's considered a static starting point.
            // However, per current implementation, openingBalance in AccountHead is the current balance.
            // So we must rely on historical JournalLines.

            const openingActivity = await this.prisma.journalLine.aggregate({
                where: {
                    accountHeadId: account.id,
                    journalEntry: {
                        status: "POSTED",
                        date: { lt: start },
                    },
                },
                _sum: {
                    amount: true,
                },
                // We'll separate debit/credit to be precise
            });

            // To get debit vs credit for opening, we need two aggregates or a group by
            const openingDebits = await this.prisma.journalLine.aggregate({
                where: {
                    accountHeadId: account.id,
                    type: "DEBIT",
                    journalEntry: { status: "POSTED", date: { lt: start } },
                },
                _sum: { amount: true },
            });

            const openingCredits = await this.prisma.journalLine.aggregate({
                where: {
                    accountHeadId: account.id,
                    type: "CREDIT",
                    journalEntry: { status: "POSTED", date: { lt: start } },
                },
                _sum: { amount: true },
            });

            const opDr = Number(openingDebits._sum.amount || 0);
            const opCr = Number(openingCredits._sum.amount || 0);

            // 3. Calculate Period Activity (between startDate and endDate)
            const periodDebits = await this.prisma.journalLine.aggregate({
                where: {
                    accountHeadId: account.id,
                    type: "DEBIT",
                    journalEntry: {
                        status: "POSTED",
                        date: { gte: start, lte: end },
                    },
                },
                _sum: { amount: true },
            });

            const periodCredits = await this.prisma.journalLine.aggregate({
                where: {
                    accountHeadId: account.id,
                    type: "CREDIT",
                    journalEntry: {
                        status: "POSTED",
                        date: { gte: start, lte: end },
                    },
                },
                _sum: { amount: true },
            });

            const perDr = Number(periodDebits._sum.amount || 0);
            const perCr = Number(periodCredits._sum.amount || 0);

            // 4. Calculate Closing Balances
            const totalDr = opDr + perDr;
            const totalCr = opCr + perCr;

            // Net them out for Trial Balance columns? Or show both?
            // Usually Trial Balance shows both columns for better auditing.

            report.push({
                accountId: account.id,
                accountName: account.name,
                accountCode: account.code,
                accountType: account.type,
                openingDebit: opDr,
                openingCredit: opCr,
                periodDebit: perDr,
                periodCredit: perCr,
                closingDebit: totalDr,
                closingCredit: totalCr,
            });
        }

        return report;
    }

    public async getTrialBalanceData(startDate: string, endDate: string) {
        const report = await this.getTrialBalance(startDate, endDate);
        const company = await this.prisma.companyProfile.findFirst({
            where: { isDeleted: false, companyType: "PARENT" },
        });

        return {
            report,
            company,
            period: { startDate, endDate },
            generatedAt: new Date().toISOString(),
        };
    }

}
