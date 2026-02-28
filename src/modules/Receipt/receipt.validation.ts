import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const ReceiptValidation = {
    // =========================
    // Create Buyer Receipt
    // =========================
    createBuyerReceipt: z
        .object({
            buyerId: z.string().uuid("Invalid buyer ID"),
            amount: z.preprocess(
                (val) => stringToNumber(val),
                z.number().positive("Amount must be positive"),
            ),
            date: z.string().refine((val) => !isNaN(Date.parse(val)), {
                message: "Invalid date format",
            }),
            paymentMethod: z.enum(["CASH", "BANK", "CHEQUE"]),
            referenceId: z.string().optional(), // Check number, transaction ID, etc.
            remarks: z.string().optional(),

            // The bank/cash account receiving the money (Optional override)
            assetAccountId: z.string().uuid("Invalid asset account ID").optional(),
            receivableAccountId: z.string().uuid("Invalid receivable account ID").optional(),
            bankAccountId: z.string().uuid("Invalid bank account ID").optional(),
        })
        .strict()
        .refine((data) => {
            return true;
        }),

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

                buyerId: z.string().uuid().optional(),

                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
    },
};

export type CreateBuyerReceiptInput = z.infer<typeof ReceiptValidation.createBuyerReceipt>;
export type ReceiptListQueryDto = z.infer<typeof ReceiptValidation.query.list>;
