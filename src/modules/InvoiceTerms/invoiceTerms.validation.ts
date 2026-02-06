// src/modules/InvoiceTerms/invoiceTerms.validation.ts
import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const InvoiceTermsValidation = {
  // Create Invoice Terms
  create: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters"),

      payment: z.string().min(2).max(200).optional(),

      delivery: z.string().min(2).max(200).optional(),

      advisingBank: z.string().min(2).max(150).optional(),

      negotiation: z.string().min(2).max(150).optional(),

      origin: z.string().min(2).max(100).optional(),

      swiftCode: z.string().min(3).max(20).optional(),

      binNo: z.string().min(3).max(50).optional(),

      hsCode: z.string().min(3).max(50).optional(),

      remarks: z.string().min(2).max(500).optional(),
    })
    .strict(),

  // Update Invoice Terms
  update: z
    .object({
      name: z.string().min(2).max(100).optional(),

      payment: z.string().min(2).max(200).optional(),

      delivery: z.string().min(2).max(200).optional(),

      advisingBank: z.string().min(2).max(150).optional(),

      negotiation: z.string().min(2).max(150).optional(),

      origin: z.string().min(2).max(100).optional(),

      swiftCode: z.string().min(3).max(20).optional(),

      binNo: z.string().min(3).max(50).optional(),

      hsCode: z.string().min(3).max(50).optional(),

      remarks: z.string().min(2).max(500).optional(),

      isDeleted: z.boolean().optional(),
      deletedAt: z.date().nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),

  // Params
  params: {
    id: z.object({
      id: z.string().uuid("Invalid ID format"),
    }),
  },

  // Query
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

      sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),
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

// Types
export type CreateInvoiceTermsInput = z.infer<
  typeof InvoiceTermsValidation.create
>;

export type UpdateInvoiceTermsInput = z.infer<
  typeof InvoiceTermsValidation.update
>;

export type InvoiceTermsIdParams = z.infer<
  typeof InvoiceTermsValidation.params.id
>;

export type ListInvoiceTermsQueryDto = z.infer<
  typeof InvoiceTermsValidation.query.list
>;

export type SearchInvoiceTermsQueryDto = z.infer<
  typeof InvoiceTermsValidation.query.search
>;

export type PaginationInvoiceTermsDto = z.infer<
  typeof InvoiceTermsValidation.query.pagination
>;
