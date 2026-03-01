import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const LedgerValidation = {
    // =========================
    // Query Validations
    // =========================
    query: {
        // Shared pagination and filtering for ledgers
        ledgerList: z
            .object({
                page: z.preprocess(
                    (val) => stringToNumber(val) || 1,
                    z.number().int().min(1).default(1),
                ),

                limit: z.preprocess((val) => {
                    const num = stringToNumber(val) || 10;
                    return Math.min(Math.max(num, 1), 100);
                }, z.number().int().min(1).max(100).default(10)),

                startDate: z
                    .string()
                    .refine((val) => !isNaN(Date.parse(val)), {
                        message: "Invalid start date format",
                    })
                    .optional(),

                endDate: z
                    .string()
                    .refine((val) => !isNaN(Date.parse(val)), {
                        message: "Invalid end date format",
                    })
                    .optional(),
            }),

        // Specific query for General Ledger (needs account head)
        generalLedger: z
            .object({
                accountHeadId: z.string().uuid("Account head ID is required"),
                page: z.preprocess(
                    (val) => stringToNumber(val) || 1,
                    z.number().int().min(1).default(1),
                ),
                limit: z.preprocess((val) => {
                    const num = stringToNumber(val) || 10;
                    return Math.min(Math.max(num, 1), 100);
                }, z.number().int().min(1).max(100).default(10)),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
    },

    // =========================
    // Params Validation
    // =========================
    params: {
        buyerId: z.object({
            id: z.string().uuid("Valid Buyer ID is required"),
        }),
        supplierId: z.object({
            id: z.string().uuid("Valid Supplier ID is required"),
        }),
    },
};

export type LedgerListQueryDto = z.infer<typeof LedgerValidation.query.ledgerList>;
export type GeneralLedgerQueryDto = z.infer<typeof LedgerValidation.query.generalLedger>;
