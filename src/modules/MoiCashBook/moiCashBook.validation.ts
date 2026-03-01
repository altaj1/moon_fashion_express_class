// src/modules/MoiCashBook/moiCashBook.validation.ts
import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const MoiCashBookValidation = {
  // Create MoiCashBook
  create: z
    .object({
      voucherNo: z.string().min(1, "Voucher number is required"),
      amount: z
        .union([z.number().positive(), z.string()])
        .transform((val) => Number(val)),
      purpose: z
        .string()
        .min(3, "Purpose must be at least 3 characters")
        .max(255),
      employeeId: z.string().uuid("Invalid Employee ID format"),
      companyProfileId: z.string().uuid("Company Profile ID is required"),
      
      // Accounting Links
      cashAccountId: z.string().uuid().optional(),    // Where cash leaves/enters
      advanceAccountId: z.string().uuid().optional(), // The "Staff Advance" control account
      expenseAccountId: z.string().uuid().optional(), // For SETTLE type with expenses
      
      type: z.enum(["ISSUE", "SETTLE", "EXPENSE"]).default("ISSUE"),
      status: z
        .enum(["PENDING", "APPROVED", "SETTLED", "REJECTED"])
        .default("PENDING"),
      remarks: z.string().max(500).optional(),
      journalEntryId: z.string().uuid().optional(),
      autoPost: z.boolean().default(true), // Automatically post the journal entry
    })
    .strict(),

  // Update MoiCashBook
  update: z
    .object({
      voucherNo: z.string().optional(),
      amount: z
        .union([z.number().positive(), z.string()])
        .transform((val) => Number(val))
        .optional(),
      purpose: z.string().min(3).max(255).optional(),
      employeeId: z.string().uuid().optional(),
      type: z.enum(["ISSUE", "SETTLE", "EXPENSE"]).optional(),
      status: z.enum(["PENDING", "APPROVED", "SETTLED", "REJECTED"]).optional(),
      remarks: z.string().max(500).optional(),
      journalEntryId: z.string().uuid().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),

  // Params validation
  params: {
    id: z.object({
      id: z.string().uuid("Invalid ID format"),
    }),
  },

  // Query validations (Search, Pagination, Filtering)
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
        search: z.string().optional(), // Filters by purpose or voucherNo
        type: z.enum(["ISSUE", "SETTLE", "EXPENSE"]).optional(),
        status: z
          .enum(["PENDING", "APPROVED", "SETTLED", "REJECTED"])
          .optional(),
        sortBy: z
          .enum(["voucherNo", "amount", "createdAt", "updatedAt"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
      .transform((data) => ({
        ...data,
        search: data.search === "" ? undefined : data.search,
      })),
  },
};

// Types
export type CreateMoiCashBookInput = z.infer<
  typeof MoiCashBookValidation.create
>;
export type UpdateMoiCashBookInput = z.infer<
  typeof MoiCashBookValidation.update
>;
export type MoiCashBookIdParams = z.infer<
  typeof MoiCashBookValidation.params.id
>;
export type ListMoiCashBookQueryDto = z.infer<
  typeof MoiCashBookValidation.query.list
>;
