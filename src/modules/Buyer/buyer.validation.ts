// src/modules/Buyer/buyer.validation.ts
import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const BuyerValidation = {
  // Create Buyer
  create: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters"),

      email: z.string().email("Invalid email address"),

      merchandiser: z
        .string()
        .min(2, "Merchandiser name must be at least 2 characters")
        .max(100, "Merchandiser name must be at most 100 characters"),

      phone: z
        .string()
        .min(5, "Phone must be at least 5 characters")
        .max(20, "Phone must be at most 20 characters")
        .optional(),

      address: z
        .string()
        .min(5, "Address must be at least 5 characters")
        .max(200, "Address must be at most 200 characters"),

      location: z
        .string()
        .min(2, "Location must be at least 2 characters")
        .max(100, "Location must be at most 100 characters"),
    })
    .strict(),

  // Update Buyer
  update: z
    .object({
      name: z.string().min(2).max(100).optional(),

      email: z.string().email("Invalid email address").optional(),

      merchandiser: z.string().min(2).max(100).optional(),

      phone: z.string().min(5).max(20).optional(),

      address: z.string().min(5).max(200).optional(),
      isDeleted: z.boolean().optional(),
      deletedAt: z.date().nullable().optional(),
      location: z.string().min(2).max(100).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),

  // Params validation
  params: {
    id: z.object({
      id: z.string().min(1, "Buyer ID is required"),
    }),
  },

  // Query validations
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
          .enum(["name", "email", "location", "createdAt", "updatedAt"])
          .default("createdAt"),

        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
      .transform((data) => ({
        ...data,
        search: data.search === "" ? undefined : data.search,
      })),

    search: z
      .object({
        q: z.string().min(1, "Search term is required").optional(),
        search: z.string().min(1, "Search term is required").optional(),

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
export type CreateBuyerInput = z.infer<typeof BuyerValidation.create>;
export type UpdateBuyerInput = z.infer<typeof BuyerValidation.update>;
export type BuyerIdParams = z.infer<typeof BuyerValidation.params.id>;
export type ListBuyerQueryDto = z.infer<typeof BuyerValidation.query.list>;
export type SearchBuyerQueryDto = z.infer<typeof BuyerValidation.query.search>;
export type PaginationBuyerDto = z.infer<
  typeof BuyerValidation.query.pagination
>;
