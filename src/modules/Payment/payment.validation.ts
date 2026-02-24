import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const PaymentValidation = {
    // =========================
    // Create Supplier Payment
    // =========================
    createSupplierPayment: z
        .object({
            supplierId: z.string().uuid("Invalid supplier ID"),
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

            // The bank/cash account being used to pay
            bankAccountId: z.string().uuid("Invalid bank account ID").optional(),
        })
        .strict()
        .refine((data) => {
            // If method is BANK or CHEQUE, bankAccountId should ideally be present
            // but we won't strictly enforce it at the schema level if there's a default "Main Bank"
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

                supplierId: z.string().uuid().optional(),

                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
    },
};

export type CreateSupplierPaymentInput = z.infer<typeof PaymentValidation.createSupplierPayment>;
export type PaymentListQueryDto = z.infer<typeof PaymentValidation.query.list>;
