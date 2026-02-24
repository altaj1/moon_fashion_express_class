import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const LoanValidation = {
    // =========================
    // Create Loan
    // =========================
    create: z
        .object({
            lenderName: z.string().min(2, "Lender name must be at least 2 characters"),
            loanType: z.string().optional(),
            principalAmount: z.preprocess(
                (val) => stringToNumber(val),
                z.number().positive("Principal amount must be positive"),
            ),
            interestRate: z.preprocess(
                (val) => stringToNumber(val),
                z.number().min(0).default(0),
            ),
            startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
                message: "Invalid start date format",
            }),
            endDate: z
                .string()
                .refine((val) => !isNaN(Date.parse(val)), {
                    message: "Invalid end date format",
                })
                .optional(),
            remarks: z.string().optional(),

            companyProfileId: z.string().uuid("Invalid company profile ID"),
        })
        .strict(),

    // =========================
    // Update Loan
    // =========================
    update: z
        .object({
            lenderName: z.string().min(2).optional(),
            loanType: z.string().optional(),
            principalAmount: z.preprocess(
                (val) => stringToNumber(val),
                z.number().positive(),
            ).optional(),
            interestRate: z.preprocess(
                (val) => stringToNumber(val),
                z.number().min(0),
            ).optional(),
            startDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
            endDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
            remarks: z.string().optional(),
            isDeleted: z.boolean().optional(),
            deletedAt: z.date().nullable().optional(),
        })
        .strict()
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field must be provided for update",
        }),

    // =========================
    // Create Repayment
    // =========================
    repayment: z
        .object({
            installmentNo: z.preprocess(
                (val) => stringToNumber(val),
                z.number().int().positive(),
            ),
            date: z.string().refine((val) => !isNaN(Date.parse(val))),
            principal: z.preprocess(
                (val) => stringToNumber(val),
                z.number().nonnegative(),
            ),
            interest: z.preprocess(
                (val) => stringToNumber(val),
                z.number().nonnegative().default(0),
            ),
        })
        .strict(),

    // =========================
    // Params Validation
    // =========================
    params: {
        id: z.object({
            id: z.string().min(1, "Loan ID is required"),
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

                sortBy: z
                    .enum(["lenderName", "principalAmount", "startDate", "createdAt"])
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

export type CreateLoanInput = z.infer<typeof LoanValidation.create>;

export type UpdateLoanInput = z.infer<typeof LoanValidation.update>;

export type CreateLoanRepaymentInput = z.infer<typeof LoanValidation.repayment>;

export type LoanIdParams = z.infer<typeof LoanValidation.params.id>;

export type ListLoanQueryDto = z.infer<typeof LoanValidation.query.list>;
