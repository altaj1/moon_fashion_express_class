import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const JournalEntryValidation = {
  // =========================
  // Create Journal Entry
  // =========================
  create: z
    .object({
      voucherNo: z
        .string()
        .min(2, "Voucher number must be at least 2 characters")
        .optional(),

      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),

      // ❌ Previously: `type: z.enum(["GENERAL", "PAYMENT", "RECEIPT", "CONTRA", "ADJUSTMENT"])`
      //    Those values didn't exist in the Prisma enum. Fixed to use `category` with correct values.
      category: z.enum([
        "CUSTOMER_DUE",
        "RECEIPT",
        "SUPPLIER_DUE",
        "PAYMENT",
        "JOURNAL",
        "CONTRA",
      ]),

      // ❌ Previously: `status: z.enum(["DRAFT", "POSTED", "CANCELLED"]).optional().default("DRAFT")`
      //    Removed — status is always DRAFT on creation (set by service, not user-controlled).

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

      // ❌ Previously: lines used `{ accountId, debit, credit }` which didn't match Prisma model.
      //    Fixed to `{ accountHeadId, type, amount }` to match JournalLine schema exactly.
      lines: z
        .array(
          z.object({
            accountHeadId: z.string().uuid("Invalid account head ID"),
            type: z.enum(["DEBIT", "CREDIT"]),
            amount: z.preprocess(
              (val) => stringToNumber(val),
              z.number().positive("Amount must be positive"),
            ),
            // Sub-ledger identifiers (optional — set when the line involves a specific entity)
            bankId: z.string().uuid("Invalid bank ID").optional(),
          }),
        )
        .min(2, "At least two journal lines required"),
    })
    .strict(),

  // =========================
  // Update Journal Entry
  // =========================
  update: z
    .object({
      voucherNo: z.string().min(2).optional(),

      date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),

      category: z
        .enum([
          "CUSTOMER_DUE",
          "RECEIPT",
          "SUPPLIER_DUE",
          "PAYMENT",
          "JOURNAL",
          "CONTRA",
        ])
        .optional(),

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
            accountHeadId: z.string().uuid("Invalid account head ID"),
            type: z.enum(["DEBIT", "CREDIT"]),
            amount: z.preprocess(
              (val) => stringToNumber(val),
              z.number().positive("Amount must be positive"),
            ),
            bankId: z.string().uuid("Invalid bank ID").optional(),
          }),
        )
        .optional(),
    })
    .strict(),

  // =========================
  // Params Validation
  // =========================
  params: {
    id: z.object({
      id: z.string().uuid("Invalid Journal Entry ID"),
    }),
  },

  // =========================
  // Query Validations
  // =========================
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

      // ❌ Previously: `type: z.enum(["GENERAL", ...])` — wrong field name + wrong values.
      //    Fixed to `category` with correct Prisma enum values.
      category: z
        .enum([
          "CUSTOMER_DUE",
          "RECEIPT",
          "SUPPLIER_DUE",
          "PAYMENT",
          "JOURNAL",
          "CONTRA",
        ])
        .optional(),

      // ❌ Previously included "CANCELLED" — that status doesn't exist in Prisma schema.
      status: z.enum(["DRAFT", "POSTED"]).optional(),

      sortBy: z.enum(["date", "voucherNo", "createdAt"]).default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  },
};

// =========================
// Types
// =========================

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
