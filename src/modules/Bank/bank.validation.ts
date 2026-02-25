import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const BankValidation = {
    // =========================
    // Create Bank
    // =========================
    create: z
        .object({
            bankName: z.string().min(2, "Bank name must be at least 2 characters"),
            accountNumber: z.string().min(2, "Account number is required"),
            branchName: z.string().optional(),
            swiftCode: z.string().optional(),
            routingNumber: z.string().optional(),

            companyProfileId: z.string().uuid("Invalid company profile ID"),
        })
        .strict(),

    // =========================
    // Update Bank
    // =========================
    update: z
        .object({
            bankName: z.string().min(2).optional(),
            accountNumber: z.string().min(2).optional(),
            branchName: z.string().optional(),
            swiftCode: z.string().optional(),
            routingNumber: z.string().optional(),
            isDeleted: z.boolean().optional(),
        })
        .strict()
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field must be provided for update",
        }),

    // =========================
    // Params Validation
    // =========================
    params: {
        id: z.object({
            id: z.string().uuid("Invalid Bank ID format"),
        }),
    },

    // =========================
    // Query Validations
    // =========================
    query: {
        list: z
            .object({
                page: z.preprocess(
                    (val) => stringToNumber(val) || 1,
                    z.number().int().min(1).default(1),
                ),

                limit: z.preprocess((val) => {
                    const num = stringToNumber(val) || 10;
                    return Math.min(Math.max(num, 1), 100);
                }, z.number().int().min(1).max(100).default(10)),

                search: z.string().optional(),

                companyProfileId: z.string().uuid().optional(),

                sortBy: z
                    .enum(["bankName", "accountNumber", "createdAt"])
                    .default("createdAt"),

                sortOrder: z.enum(["asc", "desc"]).default("desc"),

                isDeleted: z.preprocess((val) => {
                    if (val === "true") return true;
                    if (val === "false") return false;
                    return false;
                }, z.boolean().default(false)),
            })
            .transform((data) => ({
                ...data,
                search: data.search === "" ? undefined : data.search,
            })),
    },
};

// =========================
// Types
// =========================

export type CreateBankInput = z.infer<typeof BankValidation.create>;

export type UpdateBankInput = z.infer<typeof BankValidation.update>;

export type BankIdParams = z.infer<typeof BankValidation.params.id>;

export type ListBankQueryDto = z.infer<typeof BankValidation.query.list>;
