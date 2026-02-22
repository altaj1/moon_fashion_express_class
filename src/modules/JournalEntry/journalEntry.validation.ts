import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const JournalEntryValidation = {
  // ================= CREATE JOURNAL ENTRY =================
  create: z
    .object({
      voucherNo: z
        .string()
        .min(2, "Voucher number must be at least 2 characters"),

      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),

      type: z.enum(["GENERAL", "PAYMENT", "RECEIPT", "CONTRA", "ADJUSTMENT"]),

      status: z
        .enum(["DRAFT", "POSTED", "CANCELLED"])
        .optional()
        .default("DRAFT"),

      narration: z.string().max(1000).optional(),

      buyerId: z.string().uuid("Invalid buyer ID").optional(),
      supplierId: z.string().uuid("Invalid supplier ID").optional(),

      reversesId: z.string().uuid("Invalid reverse entry ID").optional(),

      invoiceRef: z.string().optional(),

      dueDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid due date format",
        })
        .optional(),

      companyProfileId: z.string().uuid("Invalid company profile ID"),

      createdById: z.string().uuid("Invalid user ID").optional(),

      lines: z
        .array(
          z.object({
            accountId: z.string().uuid("Invalid account ID"),
            debit: z
              .preprocess(
                (val) => stringToNumber(val),
                z.number().min(0, "Debit must be positive"),
              )
              .optional(),

            credit: z
              .preprocess(
                (val) => stringToNumber(val),
                z.number().min(0, "Credit must be positive"),
              )
              .optional(),

            description: z.string().optional(),
          }),
        )
        .min(2, "At least two journal lines required"),
    })
    .strict(),

  // ================= UPDATE JOURNAL ENTRY =================
  update: z
    .object({
      voucherNo: z.string().min(2).optional(),

      date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),

      type: z
        .enum(["GENERAL", "PAYMENT", "RECEIPT", "CONTRA", "ADJUSTMENT"])
        .optional(),

      status: z.enum(["DRAFT", "POSTED", "CANCELLED"]).optional(),

      narration: z.string().optional(),

      buyerId: z.string().uuid("Invalid buyer ID").optional(),
      supplierId: z.string().uuid("Invalid supplier ID").optional(),

      reversesId: z.string().uuid("Invalid reverse entry ID").optional(),

      invoiceRef: z.string().optional(),

      dueDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid due date format",
        })
        .optional(),

      createdById: z.string().uuid("Invalid user ID").optional(),

      lines: z
        .array(
          z.object({
            accountId: z.string().uuid(),
            debit: z
              .preprocess((val) => stringToNumber(val), z.number().min(0))
              .optional(),
            credit: z
              .preprocess((val) => stringToNumber(val), z.number().min(0))
              .optional(),
            description: z.string().optional(),
          }),
        )
        .optional(),
    })
    .strict(),

  // ================= PARAMS =================
  params: {
    id: z.object({
      id: z.string().uuid("Invalid Journal Entry ID"),
    }),
  },

  // ================= QUERY =================
  query: {
    list: z.object({
      page: z.preprocess(
        (val) => stringToNumber(val) || 1,
        z.number().int().min(1).default(1),
      ),

      limit: z.preprocess((val) => {
        const num = stringToNumber(val) || 10;
        return Math.min(Math.max(num, 1), 100);
      }, z.number().int().min(1).max(100).default(10)),

      search: z.string().optional(),

      type: z
        .enum(["GENERAL", "PAYMENT", "RECEIPT", "CONTRA", "ADJUSTMENT"])
        .optional(),

      status: z.enum(["DRAFT", "POSTED", "CANCELLED"]).optional(),

      sortBy: z.enum(["date", "voucherNo", "createdAt"]).default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  },
};

// ================= TYPES =================

export type CreateJournalEntryInput = z.infer<
  typeof JournalEntryValidation.create
>;

export type UpdateJournalEntryInput = z.infer<
  typeof JournalEntryValidation.update
>;

export type JournalEntryIdParams = z.infer<
  typeof JournalEntryValidation.params.id
>;

export type ListJournalEntryQueryDto = z.infer<
  typeof JournalEntryValidation.query.list
>;
