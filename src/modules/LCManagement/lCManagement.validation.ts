import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const LCManagementValidation = {
  // ================= CREATE LC =================
  create: z
    .object({
      bblcNumber: z
        .string()
        .min(2, "BBLC number must be at least 2 characters"),

      dateOfOpening: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date of opening format",
      }),
      userId: z.string().uuid("Invalid user ID").optional(),
      user: z.string().uuid("Invalid user ID").optional(),
      notifyParty: z.string().max(255).optional(),

      lcIssueBankName: z.string().min(2, "LC issue bank name is required"),

      lcIssueBankBranch: z.string().min(2, "LC issue bank branch is required"),

      destination: z.string().max(255).optional(),

      issueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid issue date format",
      }),

      expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid expiry date format",
      }),

      amount: z.preprocess(
        (val) => stringToNumber(val),
        z.number().positive("Amount must be greater than 0"),
      ),

      invoiceId: z.string().uuid("Invalid invoice ID"),
    })
    .strict(),

  // ================= UPDATE LC =================
  update: z
    .object({
      bblcNumber: z.string().min(2).optional(),

      dateOfOpening: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date of opening format",
        })
        .optional(),

      notifyParty: z.string().max(255).optional(),

      lcIssueBankName: z.string().min(2).optional(),

      lcIssueBankBranch: z.string().min(2).optional(),

      destination: z.string().max(255).optional(),

      issueDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid issue date format",
        })
        .optional(),

      expiryDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid expiry date format",
        })
        .optional(),

      amount: z
        .preprocess((val) => stringToNumber(val), z.number().positive())
        .optional(),
    })
    .strict(),

  // ================= PARAMS =================
  params: {
    id: z.object({
      id: z.string().uuid("Invalid LC ID"),
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

      sortBy: z
        .enum([
          "bblcNumber",
          "dateOfOpening",
          "issueDate",
          "expiryDate",
          "createdAt",
        ])
        .default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  },
};

// ================= TYPES =================
export type CreateLCManagementInput = z.infer<
  typeof LCManagementValidation.create
>;

export type UpdateLCManagementInput = z.infer<
  typeof LCManagementValidation.update
>;

export type LCManagementIdParams = z.infer<
  typeof LCManagementValidation.params.id
>;

export type ListLCManagementQueryDto = z.infer<
  typeof LCManagementValidation.query.list
>;
