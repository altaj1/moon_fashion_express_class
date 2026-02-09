import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateCompanyProfileInput,
  UpdateCompanyProfileInput,
} from "./companyProfile.validation";
import { sendImageToCloudinary } from "@/utils/sendImageToCloudinery";
export class CompanyProfileService extends BaseService<
  any,
  CreateCompanyProfileInput,
  UpdateCompanyProfileInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "CompanyProfile", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'companyProfile' might not exist in PrismaClient types yet
    return this.prisma.companyProfile;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async create(
    data: CreateCompanyProfileInput,
    logoUrl: Express.Multer.File | undefined,
    include?: any,
  ) {
    console.log("adkjflakjsd", { logoUrl });
    const uploadedLogoUrl = await sendImageToCloudinary(
      `${data.name}_${data.email}`,
      logoUrl.path,
      "user_avatars",
    );
    console.log({ uploadedLogoUrl });
    return super.create({ ...data, logoUrl: uploadedLogoUrl?.secure_url });
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

  public async updateById(
    id: string,
    data: UpdateCompanyProfileInput,
    include?: any,
  ) {
    return super.updateById(id, data, include);
  }

  public async softDelete(data: any): Promise<any> {
    const { id, isDeleted } = data;
    return super.updateById(id, {
      isDeleted,
    });
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
