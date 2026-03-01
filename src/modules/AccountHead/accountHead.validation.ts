import { email, z } from "zod";

export const AccountHeadValidation = {
  // ================= CREATE ACCOUNT HEAD =================
  create: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters").max(100),
      code: z.string().max(50).optional(),
      type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
      description: z.string().max(500).optional(),
      parentId: z.string().uuid().nullable().optional(),
      isControlAccount: z.boolean().default(false).optional(),
      companyProfileId: z
        .string()
        .uuid("Invalid company profile ID")
        .optional(),
      isDeleted: z.boolean().optional(),
    })
    .strict(),

  // ================= UPDATE ACCOUNT HEAD =================
  update: z
    .object({
      name: z.string().min(2).max(100).optional(),
      email: z.string().email("Invalid email address").optional(),
      phone: z.string().max(20).optional(),
      address: z.string().max(200).optional(),
      code: z.string().max(50).optional(),
      parentId: z.string().uuid().nullable().optional(),
      isControlAccount: z.boolean().optional(),
      type: z
        .enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"])
        .optional(),
      description: z.string().max(500).optional(),
      isDeleted: z.boolean().optional(),
    })
    .strict(),

  // ================= PARAMS =================
  params: {
    id: z.object({
      id: z.string().uuid("Invalid Account Head ID"),
    }),
  },

  // ================= QUERY =================
  query: {
    list: z.object({
      page: z.preprocess(
        (val) => Number(val) || 1,
        z.number().int().min(1).default(1),
      ),

      limit: z.preprocess((val) => {
        const num = Number(val) || 10;
        return Math.min(Math.max(num, 1), 100);
      }, z.number().int().min(1).max(100).default(10)),

      search: z.string().optional(),

      type: z
        .enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"])
        .optional(),

      sortBy: z.enum(["name", "code", "createdAt"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      isDeleted: z.preprocess(
        (val) => val === "true",
        z.boolean().default(false),
      ),
    }),
  },
};

// ================= TYPES =================
export type CreateAccountHeadInput = z.infer<
  typeof AccountHeadValidation.create
>;
export type UpdateAccountHeadInput = z.infer<
  typeof AccountHeadValidation.update
>;
export type AccountHeadIdParams = z.infer<
  typeof AccountHeadValidation.params.id
>;
export type ListAccountHeadQueryDto = z.infer<
  typeof AccountHeadValidation.query.list
>;
