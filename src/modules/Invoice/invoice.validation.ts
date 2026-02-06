// src/modules/Invoice/invoice.validation.ts
import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const InvoiceValidation = {
  // Create Invoice
  create: z
    .object({
      piNumber: z.string().min(2, "PI Number must be at least 2 characters"),
      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),
      type: z.enum(["FABRIC", "LABEL_TAG", "CARTON"]),
      buyerId: z.string().uuid("Invalid buyer ID").optional(),
      userId: z.string().uuid("Invalid user ID").optional(),
      totalAmount: z.number().nonnegative(),
      // status: z.enum(["DRAFT", "FINAL", "PAID"]).default("DRAFT"),
      invoiceTermsId: z.string().uuid().optional(),

      invoiceItem: z
        .object({
          fabricItem: z
            .object({
              styleNo: z.string(),
              discription: z.string().optional(),
              width: z.string().optional(),
              totalNetWeight: z.number().optional(),
              totalGrossWeight: z.number().optional(),
              totalQuantityYds: z.number().optional(),
              totalUnitPrice: z.number().optional(),
              totalAmount: z.number().optional(),
              fabricItemData: z
                .array(
                  z.object({
                    color: z.string(),
                    netWeight: z.number().optional(),
                    grossWeight: z.number().optional(),
                    quantityYds: z.number().optional(),
                    unitPrice: z.number().optional(),
                    totalAmount: z.number().optional(),
                  }),
                )
                .optional(),
            })
            .optional(),

          labelItem: z
            .object({
              styleNo: z.string(),
              netWeightTotal: z.number().optional(),
              grossWeightTotal: z.number().optional(),
              quantityDznTotal: z.number().optional(),
              quantityPcsTotal: z.number().optional(),
              unitPriceTotal: z.number().optional(),
              totalAmount: z.number().optional(),
              labelItemData: z
                .array(
                  z.object({
                    desscription: z.string().optional(),
                    color: z.string(),
                    netWeight: z.number().optional(),
                    grossWeight: z.number().optional(),
                    quantityDzn: z.number().optional(),
                    quantityPcs: z.number().optional(),
                    unitPrice: z.number().optional(),
                    TotalAmount: z.number().optional(),
                  }),
                )
                .optional(),
            })
            .optional(),

          cartonItem: z
            .object({
              orderNo: z.string(),
              totalcartonQty: z.number().optional(),
              totalNetWeight: z.number().optional(),
              totalGrossWeight: z.number().optional(),
              totalUnitPrice: z.number().optional(),
              cartonItemData: z
                .array(
                  z.object({
                    cartonMeasurement: z.string().optional(),
                    cartonPly: z.string().optional(),
                    cartonQty: z.number().optional(),
                    netWeight: z.number().optional(),
                    grossWeight: z.number().optional(),
                    unit: z.string().optional(),
                    unitPrice: z.number().optional(),
                    totalAmount: z.number().optional(),
                  }),
                )
                .optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .strict(),

  // Update Invoice
  update: z
    .object({
      piNumber: z.string().min(2).optional(),
      date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      type: z.enum(["EXPORT", "LOCAL"]).optional(),
      buyerId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      totalAmount: z.number().nonnegative().optional(),
      status: z.enum(["DRAFT", "FINAL", "PAID"]).optional(),
      invoiceTermsId: z.string().uuid().optional(),
    })
    .strict(),

  // Params validation
  params: {
    id: z.object({
      id: z.string().uuid("Invalid invoice ID"),
    }),
  },

  // Query validation for pagination, search, limit
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
      sortBy: z
        .enum(["piNumber", "date", "totalAmount", "createdAt"])
        .default("createdAt"),
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
