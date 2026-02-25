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
        {
            name: "Cash",
            type: AccountType.ASSET,
            description: "Petty cash and drawer funds",
            isControlAccount: false,
        },
        {
            name: "Main Bank Account",
            type: AccountType.ASSET,
            description: "Primary checking account",
            isControlAccount: false,
        },
        {
            name: "Accounts Receivable",
            type: AccountType.ASSET,
            description: "Money owed by buyers (Control Account)",
            isControlAccount: true,
        },
        {
            name: "Inventory",
            type: AccountType.ASSET,
            description: "Current value of fabrics, labels, cartons",
            isControlAccount: true,
        },
        {
            name: "Accounts Payable",
            type: AccountType.LIABILITY,
            description: "Money owed to suppliers (Control Account)",
            isControlAccount: true,
        },
        {
            name: "Sales Revenue",
            type: AccountType.INCOME,
            description: "Revenue from invoices",
            isControlAccount: false,
        },
        {
            name: "Cost of Goods Sold",
            type: AccountType.EXPENSE,
            description: "Direct costs of production (Fabric, Labor, etc.)",
            isControlAccount: false,
        },
        {
            name: "Bank Loan - Standard Bank",
            type: AccountType.LIABILITY,
            description: "Primary lending facility",
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
