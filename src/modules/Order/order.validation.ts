import { z } from "zod";
import { stringToNumber } from "@/utils/stringToNumber";

export const OrderValidation = {
  // ================= CREATE ORDER =================
  create: z
    .object({
      orderNumber: z
        .string()
        .min(2, "Order number must be at least 2 characters"),

      orderDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid order date format",
      }),

      remarks: z.string().max(500).optional(),

      productType: z.enum(["FABRIC", "LABEL_TAG", "CARTON"]),

      buyerId: z.string().uuid("Invalid buyer ID"),
      userId: z.string().uuid("Invalid user ID").optional(),
      companyProfileId: z.string().uuid("Invalid company profile ID"),

      status: z
        .enum([
          "DRAFT",
          "PENDING",
          "PROCESSING",
          "APPROVED",
          "DELIVERED",
          "CANCELLED",
        ])
        .optional()
        .default("DRAFT"),

      deliveryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid delivery date format",
      }),

      orderItems: z
        .object({
          fabricItem: z
            .object({
              styleNo: z.string(),
              discription: z.string().optional(),
              width: z.string(),
              totalNetWeight: z.number().optional(),
              totalGrossWeight: z.number().optional(),
              totalQuantityYds: z.number().optional(),
              totalUnitPrice: z.number().optional(),
              totalAmount: z.number().optional(),
              fabricItemData: z
                .array(
                  z.object({
                    color: z.string().optional(),
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
                    color: z.string().optional(),
                    netWeight: z.number().optional(),
                    grossWeight: z.number().optional(),
                    quantityDzn: z.number().optional(),
                    quantityPcs: z.number().optional(),
                    unitPrice: z.number().optional(),
                    totalAmount: z.number().optional(),
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

  // ================= UPDATE ORDER =================
  update: z
    .object({
      orderNumber: z.string().min(2).optional(),

      orderDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid order date format",
        })
        .optional(),

      remarks: z.string().max(500).optional(),

      productType: z.enum(["FABRIC", "LABEL_TAG", "CARTON"]).optional(),

      buyerId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      companyProfileId: z.string().uuid().optional(),

      status: z
        .enum([
          "DRAFT",
          "PENDING",
          "PROCESSING",
          "APPROVED",
          "DELIVERED",
          "CANCELLED",
        ])
        .optional(),

      deliveryDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid delivery date format",
        })
        .optional(),

      orderItems: z.any().optional(),
      isDeleted: z.boolean().optional(),
      deletedAt: z.date().nullable().optional(),
    })
    .strict(),

  // ================= PARAMS =================
  params: {
    id: z.object({
      id: z.string().uuid("Invalid order ID"),
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
      status: z
        .enum([
          "DRAFT",
          "PENDING",
          "PROCESSING",
          "APPROVED",
          "DELIVERED",
          "CANCELLED",
        ])
        .optional(),
      isDeleted: z.boolean().optional(),
      isInvoice: z.boolean().optional(),
      isLc: z.boolean().optional(),
      productType: z.enum(["FABRIC", "LABEL_TAG", "CARTON"]).optional(),
      sortBy: z
        .enum(["orderNumber", "orderDate", "createdAt"])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  },
};

// ================= TYPES =================
export type CreateOrderInput = z.infer<typeof OrderValidation.create>;
export type UpdateOrderInput = z.infer<typeof OrderValidation.update>;
export type OrderIdParams = z.infer<typeof OrderValidation.params.id>;
export type ListOrderQueryDto = z.infer<typeof OrderValidation.query.list>;
