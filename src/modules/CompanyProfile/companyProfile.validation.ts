// src/modules/CompanyProfile/companyProfile.validation.ts
import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const CompanyProfileValidation = {
  // ===============================
  // Create Company Profile
  // ===============================
  create: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters"),

      address: z.string().max(255).optional(),
      phone: z.string().max(20).optional(),
      email: z.string().email("Invalid email format").optional(),
      website: z.string().url("Invalid website URL").optional(),
      logoUrl: z.string().url("Invalid logo URL").optional(),

      city: z.string().max(100).optional(),
      country: z.string().max(100).optional(),

      companyType: z.enum(["PARENT", "SISTER"]).optional().default("PARENT"),

      postalCode: z.string().max(20).optional(),
      taxId: z.string().max(50).optional(),
      registrationNumber: z.string().max(100).optional(),

      tradeLicenseNumber: z.string().max(100).optional(),
      tradeLicenseExpiryDate: z.string().datetime().optional(),

      bankName: z.string().max(100).optional(),
      bankAccountNumber: z.string().max(50).optional(),
      branchName: z.string().max(100).optional(),
      swiftCode: z.string().max(50).optional(),
      routingNumber: z.string().max(50).optional(),

      status: z
        .enum(["active", "inactive", "suspended"])
        .optional()
        .default("active"),
    })
    .strict(),

  // ===============================
  // Update Company Profile
  // ===============================
  update: z
    .object({
      name: z.string().min(2).max(100).optional(),

      address: z.string().max(255).optional(),
      phone: z.string().max(20).optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
      logoUrl: z.string().url().optional(),

      city: z.string().max(100).optional(),
      country: z.string().max(100).optional(),

      companyType: z.enum(["PARENT", "SISTER"]).optional(),

      postalCode: z.string().max(20).optional(),
      taxId: z.string().max(50).optional(),
      registrationNumber: z.string().max(100).optional(),

      tradeLicenseNumber: z.string().max(100).optional(),
      tradeLicenseExpiryDate: z.string().datetime().optional(),

      bankName: z.string().max(100).optional(),
      bankAccountNumber: z.string().max(50).optional(),
      branchName: z.string().max(100).optional(),
      swiftCode: z.string().max(50).optional(),
      routingNumber: z.string().max(50).optional(),

      status: z.enum(["active", "inactive", "suspended"]).optional(),
      isDeleted: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),

  // ===============================
  // Params
  // ===============================
  params: {
    id: z.object({
      id: z.string().uuid("Invalid ID format"),
    }),
  },

  // ===============================
  // Query
  // ===============================
  query: {
    // List companies
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

      companyType: z.enum(["PARENT", "SISTER"]).optional(),

      status: z.enum(["active", "inactive", "suspended"]).optional(),

      sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),

    // Search companies
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

    // Pagination only
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

// ===============================
// Types
// ===============================
export type CreateCompanyProfileInput = z.infer<
  typeof CompanyProfileValidation.create
>;

export type UpdateCompanyProfileInput = z.infer<
  typeof CompanyProfileValidation.update
>;

export type CompanyProfileIdParams = z.infer<
  typeof CompanyProfileValidation.params.id
>;

export type ListCompanyProfileQueryDto = z.infer<
  typeof CompanyProfileValidation.query.list
>;

export type SearchCompanyProfileQueryDto = z.infer<
  typeof CompanyProfileValidation.query.search
>;

export type PaginationCompanyProfileDto = z.infer<
  typeof CompanyProfileValidation.query.pagination
>;
