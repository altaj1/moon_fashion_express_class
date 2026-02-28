import { AccountType } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Starting to seed default Chart of Accounts...");

    // Assume the first CompanyProfile or create one if none exists
    let company = await prisma.companyProfile.findFirst();
    if (!company) {
        company = await prisma.companyProfile.create({
            data: {
                name: "Default Textile Company",
                address: "123 Textile Ave",
            }
        });
        console.log("Created default company profile.");
    }

    // Define default chart of accounts
    // We need AR, AP, Cash, Bank, Sales Revenue, and COGS/Inventory
    const accounts = [
        // ============= ASSETS =============
        {
            name: "Cash in Hand",
            code: "1001",
            type: AccountType.ASSET,
            description: "Physical cash in office",
            isControlAccount: false,
        },
        {
            name: "Main Bank Account",
            code: "1002",
            type: AccountType.ASSET,
            description: "Primary checking account (DBBL)",
            isControlAccount: false,
        },
        {
            name: "Accounts Receivable",
            code: "1100",
            type: AccountType.ASSET,
            description: "Money owed by buyers (Control Account)",
            isControlAccount: true,
        },
        {
            name: "Inventory (Stock)",
            code: "1200",
            type: AccountType.ASSET,
            description: "Valuation of fabrics, tags, cartons",
            isControlAccount: true,
        },
        {
            name: "Furniture & Fixtures",
            code: "1501",
            type: AccountType.ASSET,
            description: "Office furniture",
            isControlAccount: false,
        },

        // ============= LIABILITIES =============
        {
            name: "Accounts Payable",
            code: "2100",
            type: AccountType.LIABILITY,
            description: "Money owed to suppliers (Control Account)",
            isControlAccount: true,
        },
        {
            name: "Bank Loan - Short Term",
            code: "2201",
            type: AccountType.LIABILITY,
            description: "Lending facility",
            isControlAccount: false,
        },
        {
            name: "Accrued Salaries",
            code: "2301",
            type: AccountType.LIABILITY,
            description: "Salaries payable",
            isControlAccount: false,
        },

        // ============= EQUITY =============
        {
            name: "Owner's Capital",
            code: "3001",
            type: AccountType.EQUITY,
            description: "Initial investment",
            isControlAccount: false,
        },
        {
            name: "Retained Earnings",
            code: "3101",
            type: AccountType.EQUITY,
            description: "Accumulated profits",
            isControlAccount: false,
        },

        // ============= INCOME =============
        {
            name: "Sales Revenue",
            code: "4001",
            type: AccountType.INCOME,
            description: "Revenue from merchandise sales",
            isControlAccount: false,
        },
        {
            name: "Interest Income",
            code: "4101",
            type: AccountType.INCOME,
            description: "Bank interest",
            isControlAccount: false,
        },

        // ============= EXPENSES =============
        {
            name: "Cost of Goods Sold (COGS)",
            code: "5001",
            type: AccountType.EXPENSE,
            description: "Direct manufacturing costs",
            isControlAccount: false,
        },
        {
            name: "Office Rent",
            code: "5101",
            type: AccountType.EXPENSE,
            description: "Monthly office rental",
            isControlAccount: false,
        },
        {
            name: "Staff Salaries",
            code: "5201",
            type: AccountType.EXPENSE,
            description: "Employee compensation",
            isControlAccount: false,
        },
        {
            name: "Utilities (Electricity/Water/Gas)",
            code: "5301",
            type: AccountType.EXPENSE,
            description: "Building utility bills",
            isControlAccount: false,
        },
        {
            name: "Factory Overheads",
            code: "5401",
            type: AccountType.EXPENSE,
            description: "Indirect production costs",
            isControlAccount: false,
        }
    ];

    for (const acc of accounts) {
        const existing = await prisma.accountHead.findFirst({
            where: { name: acc.name, companyProfileId: company.id }
        });

        if (!existing) {
            await prisma.accountHead.create({
                data: {
                    ...acc,
                    companyProfileId: company.id,
                }
            });
            console.log(`Created account: ${acc.name}`);
        } else {
            console.log(`Account already exists: ${acc.name}`);
        }
    }

    console.log("Seed completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
