import { de } from "zod/v4/locales";
// src/modules/Invoice/invoice.validation.ts
import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const InvoiceValidation = {
  // ✅ Create Invoice
  create: z
    .object({
      piNumber: z.string().min(2, "PI Number must be at least 2 characters"),

      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),

      // Required relation
      orderId: z.string().uuid("Invalid order ID"),

      // Usually comes from auth (optional in body)
      userId: z.string().uuid("Invalid user ID").optional(),

      // Optional relation
      invoiceTermsId: z.string().uuid().optional(),

      // Optional status (default DRAFT in DB)
      status: z
        .enum(["DRAFT", "SENT", "APPROVED", "CANCELLED"])
        .default("DRAFT"),
    })
    .strict(),

  // ✅ Update Invoice
  update: z
    .object({
      piNumber: z.string().min(2).optional(),

      date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),

      orderId: z.string().uuid().optional(),

      userId: z.string().uuid().optional(),

      invoiceTermsId: z.string().uuid().nullable().optional(),

      status: z.enum(["DRAFT", "SENT", "APPROVED", "CANCELLED"]).optional(),
    })
    .strict(),

  // ✅ Params validation
  params: {
    id: z.object({
      id: z.string().uuid("Invalid invoice ID"),
    }),
  },

  // ✅ Query validation
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
      status: z.enum(["DRAFT", "SENT", "APPROVED", "CANCELLED"]).optional(),
      productType: z.enum(["FABRIC", "LABEL_TAG", "CARTON"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      search: z.string().optional(),

      sortBy: z
        .enum(["piNumber", "date", "createdAt", "status"])
        .default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      isDeleted: z.preprocess((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return false;
      }, z.boolean().default(false)),
    }),

    search: z
      .object({
        q: z.string().optional(),
        search: z.string().optional(),
        limit: z.preprocess((val) => {
          const num = stringToNumber(val) || 10;
          return Math.min(Math.max(num, 1), 50);
        }, z.number().int().min(1).max(50).default(10)),
      })
      .refine((data) => data.q || data.search, {
        message: 'Either "q" or "search" parameter is required',
        path: ["q"],
      }),

    pagination: z.object({
      page: z.preprocess(
        (val) => stringToNumber(val) || 1,
        z.number().int().min(1).default(1),
      ),

      limit: z.preprocess((val) => {
        const num = stringToNumber(val) || 10;
        return Math.min(Math.max(num, 1), 100);
      }, z.number().int().min(1).max(100).default(10)),
    }),
  },
};

// ✅ Types
export type CreateInvoiceInput = z.infer<typeof InvoiceValidation.create>;
export type UpdateInvoiceInput = z.infer<typeof InvoiceValidation.update>;
export type InvoiceIdParams = z.infer<typeof InvoiceValidation.params.id>;
export type ListInvoiceQueryDto = z.infer<typeof InvoiceValidation.query.list>;
export type SearchInvoiceQueryDto = z.infer<
  typeof InvoiceValidation.query.search
>;
export type PaginationInvoiceDto = z.infer<
  typeof InvoiceValidation.query.pagination
>;
