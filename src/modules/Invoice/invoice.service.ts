// import { BaseService } from "@/core/BaseService";
// import { PrismaClient, InvoiceType } from "@/generated/prisma/client";
// import { PaginationOptions } from "@/types/types";
// import { CreateInvoiceInput, UpdateInvoiceInput } from "./invoice.validation";
// import { prisma } from "@/lib/prisma";
// export class InvoiceService extends BaseService<
//   any,
//   CreateInvoiceInput,
//   UpdateInvoiceInput
// > {
//   constructor(prisma: PrismaClient) {
//     super(prisma, "Invoice", {
//       enableSoftDelete: true,
//       enableAuditFields: true,
//     });
//   }

//   protected getModel() {
//     // @ts-ignore - The model 'invoice' might not exist in PrismaClient types yet
//     return this.prisma.invoice;
//   }

//   // =========================================================================
//   // Public API - Exposing BaseService methods
//   // Since BaseService methods are protected, we must expose them here
//   // =========================================================================

//   public async create(data: CreateInvoiceInput, include?: any) {
//     const { type, invoiceItem, invoiceTermsId, ...invoiceRest } = data;

//     let invoiceItemCreateData: any = {};

//     if (type === InvoiceType.FABRIC && invoiceItem?.fabricItem) {
//       const fabric = invoiceItem.fabricItem;

//       invoiceItemCreateData = {
//         fabricItem: {
//           create: {
//             styleNo: fabric.styleNo,
//             discription: fabric.discription,
//             width: fabric.width,
//             totalNetWeight: fabric.totalNetWeight,
//             totalGrossWeight: fabric.totalGrossWeight,
//             totalQuantityYds: fabric.totalQuantityYds,
//             totalUnitPrice: fabric.totalUnitPrice,
//             totalAmount: fabric.totalAmount,

//             fabricItemData: {
//               createMany: {
//                 data: fabric.fabricItemData || [],
//               },
//             },
//           },
//         },
//       };
//     } else if (type === InvoiceType.LABEL_TAG && invoiceItem?.labelItem) {
//       const label = invoiceItem.labelItem;

//       invoiceItemCreateData = {
//         labelItem: {
//           create: {
//             styleNo: label.styleNo,
//             netWeightTotal: label.netWeightTotal,
//             grossWeightTotal: label.grossWeightTotal,
//             quantityDznTotal: label.quantityDznTotal,
//             quantityPcsTotal: label.quantityPcsTotal,
//             unitPriceTotal: label.unitPriceTotal,
//             totalAmount: label.totalAmount,

//             labelItemData: {
//               createMany: {
//                 data: label.labelItemData || [],
//               },
//             },
//           },
//         },
//       };
//     } else if (type === InvoiceType.CARTON && invoiceItem?.cartonItem) {
//       const carton = invoiceItem.cartonItem;

//       invoiceItemCreateData = {
//         cartonItem: {
//           create: {
//             orderNo: carton.orderNo,
//             totalcartonQty: carton.totalcartonQty,
//             totalNetWeight: carton.totalNetWeight,
//             totalGrossWeight: carton.totalGrossWeight,
//             totalUnitPrice: carton.totalUnitPrice,

//             cartonItemData: {
//               createMany: {
//                 data: carton.cartonItemData || [],
//               },
//             },
//           },
//         },
//       };
//     }

//     if (Object.keys(invoiceItemCreateData).length === 0) {
//       throw new Error(
//         `Invalid invoice type or missing item data for type: ${type}`,
//       );
//     }

//     console.log(
//       "Creating invoice with data:",
//       JSON.stringify(invoiceItemCreateData, null, 2),
//     );
//     return prisma.invoice.create({
//       data: {
//         ...invoiceRest,
//         type,
//         invoiceTermsId,
//         //   status: data.status || PIStatus.DRAFT,

//         invoiceItem: {
//           create: invoiceItemCreateData,
//         },
//       },
//       include,
//     });
//     // return super.create();
//   }
//   public async findMany(
//     filters: any = {},
//     pagination?: Partial<PaginationOptions>,
//     orderBy?: any,
//     include?: any,
//   ) {
//     return super.findMany(filters, pagination, orderBy, include);
//   }

//   public async findById(id: string, include?: any) {
//     return super.findById(id, include);
//   }

//   public async updateById(id: string, data: UpdateInvoiceInput, include?: any) {
//     return super.updateById(id, data, include);
//   }

//   public async deleteById(id: string) {
//     return super.deleteById(id);
//   }

//   public async exists(filters: any) {
//     return super.exists(filters);
//   }
// }

import { BaseService } from "@/core/BaseService";
import { prisma } from "@/lib/prisma";
import { PrismaClient, InvoiceType } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { CreateInvoiceInput, UpdateInvoiceInput } from "./invoice.validation";

export class InvoiceService extends BaseService<
  any,
  CreateInvoiceInput,
  UpdateInvoiceInput
> {
  constructor() {
    super(prisma, "Invoice", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'invoice' might not exist in PrismaClient types yet
    return prisma.invoice;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // =========================================================================

  public async create(data: CreateInvoiceInput, include?: any) {
    const { type, invoiceItem, invoiceTermsId, ...invoiceRest } = data;

    let invoiceItemCreateData: any = {};

    if (type === InvoiceType.FABRIC && invoiceItem?.fabricItem) {
      const fabric = invoiceItem.fabricItem;

      invoiceItemCreateData = {
        fabricItem: {
          create: {
            styleNo: fabric.styleNo,
            discription: fabric.discription,
            width: fabric.width,
            totalNetWeight: fabric.totalNetWeight,
            totalGrossWeight: fabric.totalGrossWeight,
            totalQuantityYds: fabric.totalQuantityYds,
            totalUnitPrice: fabric.totalUnitPrice,
            totalAmount: fabric.totalAmount,

            fabricItemData: {
              createMany: {
                data: fabric.fabricItemData || [],
              },
            },
          },
        },
      };
    } else if (type === InvoiceType.LABEL_TAG && invoiceItem?.labelItem) {
      const label = invoiceItem.labelItem;

      invoiceItemCreateData = {
        labelItem: {
          create: {
            styleNo: label.styleNo,
            netWeightTotal: label.netWeightTotal,
            grossWeightTotal: label.grossWeightTotal,
            quantityDznTotal: label.quantityDznTotal,
            quantityPcsTotal: label.quantityPcsTotal,
            unitPriceTotal: label.unitPriceTotal,
            totalAmount: label.totalAmount,

            labelItemData: {
              createMany: {
                data: label.labelItemData || [],
              },
            },
          },
        },
      };
    } else if (type === InvoiceType.CARTON && invoiceItem?.cartonItem) {
      const carton = invoiceItem.cartonItem;

      invoiceItemCreateData = {
        cartonItem: {
          create: {
            orderNo: carton.orderNo,
            totalcartonQty: carton.totalcartonQty,
            totalNetWeight: carton.totalNetWeight,
            totalGrossWeight: carton.totalGrossWeight,
            totalUnitPrice: carton.totalUnitPrice,

            cartonItemData: {
              createMany: {
                data: carton.cartonItemData || [],
              },
            },
          },
        },
      };
    }

    if (Object.keys(invoiceItemCreateData).length === 0) {
      throw new Error(
        `Invalid invoice type '${type}' or missing corresponding item data`,
      );
    }

    console.log(
      "Creating invoice with data:",
      JSON.stringify(
        {
          ...invoiceRest,
          type,
          buyerId: data.buyerId,
          userId: data.userId,
          invoiceTermsId,
          invoiceItem: invoiceItemCreateData,
        },
        null,
        2,
      ),
    );
    console.log(
      "Invoice model has buyerId field?",
      "buyerId" in prisma.invoice.fields,
    );
    console.log(
      "Invoice model has userId field?",
      "userId" in prisma.invoice.fields,
    );
    // return prisma.invoice.create({
    //   data: {
    //     ...invoiceRest,
    //     type,
    //     buyerId: data.buyerId,
    //     userId: data.userId,
    //     invoiceTermsId,
    //     invoiceItem: {
    //       create: invoiceItemCreateData,
    //     },
    //   },
    //   include,
    // });
    // return super.create(
    //   {
    //     ...invoiceRest,
    //     type,
    //     // buyerId: data.buyerId,
    //     // userId: data.userId,
    //     // invoiceTermsId,
    //     buyer: {
    //       connect: {
    //         id: data.buyerId!,
    //       },
    //     },
    //     user: {
    //       connect: {
    //         id: data.userId!,
    //       },
    //     },
    //     invoiceTerms: {
    //       connect: {
    //         id: invoiceTermsId!,
    //       },
    //     },
    //     invoiceItem: {
    //       create: invoiceItemCreateData,
    //     },
    //   },
    //   include,
    // );

    const result = await prisma.invoice.create({
      data: {
        piNumber: "PI-2026-002",
        date: new Date("2026-02-06"),
        type: "FABRIC",
        totalAmount: 2500,
        status: "DRAFT",
        buyer: {
          connect: { id: "3a907837-5e00-40ea-b607-ae12573c22b3" },
        },
        user: {
          connect: { id: "99bbf61c-ae94-475b-a7a1-2a5adc905287" },
        },
        invoiceTerms: {
          connect: { id: "17c186ed-e987-470c-a32c-d612a044b65d" },
        },
        invoiceItem: {
          create: {
            fabricItem: {
              create: {
                styleNo: "FAB-1002",
                discription: "Premium Linen Fabric",
                width: "60 inch",
                totalNetWeight: 300,
                totalGrossWeight: 315,
                totalQuantityYds: 600,
                totalUnitPrice: 3,
                totalAmount: 1800,
                fabricItemData: {
                  createMany: {
                    data: [
                      {
                        color: "White",
                        netWeight: 150,
                        grossWeight: 157.5,
                        quantityYds: 300,
                        unitPrice: 3,
                        totalAmount: 900,
                      },
                      {
                        color: "Beige",
                        netWeight: 150,
                        grossWeight: 157.5,
                        quantityYds: 300,
                        unitPrice: 3,
                        totalAmount: 900,
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });
    console.log("Created invoice:", JSON.stringify(result, null, 2));
    return result;
  }

  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
    include?: any,
  ) {
    return super.findMany(filters, pagination, orderBy, include);
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, include);
  }

  public async updateById(id: string, data: UpdateInvoiceInput, include?: any) {
    return super.updateById(id, data, include);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
