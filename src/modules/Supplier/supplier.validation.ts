// src/modules/Supplier/supplier.validation.ts
import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const SupplierValidation = {
  // =========================
  // Create Supplier
  // =========================
  create: z
    .object({
      name: z.string().min(2).max(100),
      email: z.string().email("Invalid email address"),
      phone: z.string().min(5).max(20),
      address: z.string().min(5).max(200),
      location: z.string().min(2).max(100),

      // NEW FIELDS
      supplierCode: z
        .string()
        .min(2, "Code must be at least 2 characters")
        .max(50, "Code must be at most 50 characters"),
      openingLiability: z
        .number()
        .nonnegative("Liability cannot be negative")
        .default(0),
    })
    .strict(),

  // =========================
  // Update Supplier
  // =========================
  update: z
    .object({
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(5).max(20).optional(),
      address: z.string().min(5).max(200).optional(),
      location: z.string().min(2).max(100).optional(),

      // NEW FIELDS
      supplierCode: z.string().min(2).max(50).optional(),
      openingLiability: z.number().nonnegative().optional(),

      isDeleted: z.boolean().optional(),
      deletedAt: z.date().nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),

  // =========================
  // Params Validation
  // =========================
  params: {
    id: z.object({
      id: z.string().min(1, "Supplier ID is required"),
    }),
  },

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

        search: z.string().optional(),

        sortBy: z
          .enum(["name", "email", "location", "createdAt", "updatedAt"])
          .default("createdAt"),

        sortOrder: z.enum(["asc", "desc"]).default("desc"),

        isDeleted: z.preprocess((val) => {
          if (val === "true") return true;
          if (val === "false") return false;
          return false;
        }, z.boolean().default(false)),
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

// =========================
// Types
// =========================

export type CreateSupplierInput = z.infer<typeof SupplierValidation.create>;

export type UpdateSupplierInput = z.infer<typeof SupplierValidation.update>;

export type SupplierIdParams = z.infer<typeof SupplierValidation.params.id>;

export type ListSupplierQueryDto = z.infer<
  typeof SupplierValidation.query.list
>;

export type SearchSupplierQueryDto = z.infer<
  typeof SupplierValidation.query.search
>;

export type PaginationSupplierDto = z.infer<
  typeof SupplierValidation.query.pagination
>;
