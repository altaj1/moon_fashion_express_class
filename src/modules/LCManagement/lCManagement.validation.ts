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

      notifyParty: z.string().max(255).optional(),

      lcIssueBankName: z.string().min(2, "LC issue bank name is required"),

      lcIssueBankBranch: z.string().min(2, "LC issue bank branch is required"),

      destination: z.string().max(255).optional(),

      exportLcNo: z.string().min(2, "Export LC No is required"),

      binNo: z.string().min(2, "BIN No is required"),

      hsCodeNo: z.string().min(2, "HS Code No is required"),

      remarks: z.string().min(1, "Remarks is required"),

      carrier: z.string().min(1, "Carrier is required"),

      issueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid issue date format",
      }),

      expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid expiry date format",
      }),
      exportLcDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid export LC date format",
      }),
      amount: z.preprocess(
        (val) => stringToNumber(val),
        z.number().positive("Amount must be greater than 0"),
      ),

      challanNo: z.string().min(1, "Challan No is required"),

      transportMode: z.string().min(1, "Transport mode is required"),

      vehicleNo: z.string().min(1, "Vehicle No is required"),

      driverName: z.string().min(1, "Driver name is required"),

      contactNo: z.string().min(5, "Contact No is required"),

      userId: z.string().uuid("Invalid user ID").optional(),
      salesTerm: z.string().min(1, "Sales term is required"),
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

      exportLcNo: z.string().min(2).optional(),

      binNo: z.string().min(2).optional(),

      hsCodeNo: z.string().min(2).optional(),

      remarks: z.string().optional(),

      carrier: z.string().optional(),

      salesTerm: z.string().optional(),

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

      challanNo: z.string().optional(),

      transportMode: z.string().optional(),

      vehicleNo: z.string().optional(),

      driverName: z.string().optional(),

      contactNo: z.string().optional(),
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
          "exportLcNo",
          "createdAt",
        ])
        .default("createdAt"),
      isDeleted: z.preprocess((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return false;
      }, z.boolean().default(false)),
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
