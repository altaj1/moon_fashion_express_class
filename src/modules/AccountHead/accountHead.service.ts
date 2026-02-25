import { BaseService } from "@/core/BaseService";
import { PrismaClient } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import {
  CreateAccountHeadInput,
  UpdateAccountHeadInput,
} from "./accountHead.validation";
import { profile } from "node:console";

export class AccountHeadService extends BaseService<
  any,
  CreateAccountHeadInput,
  UpdateAccountHeadInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, "AccountHead", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    // @ts-ignore - The model 'accountHead' might not exist in PrismaClient types yet
    return this.prisma.accountHead;
  }

  // =========================================================================
  // Public API - Exposing BaseService methods
  // Since BaseService methods are protected, we must expose them here
  // =========================================================================

  public async create(data: CreateAccountHeadInput, include?: any) {
    return super.create(data, include);
  }

  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
    include?: any,
  ) {
    return super.findMany(filters, pagination, orderBy, {
      parent: true,
      children: true,
    });
  }

  public async findById(id: string, include?: any) {
    return super.findById(id, {
      parent: true,
      children: true,
    });
  }

  public async updateById(
    id: string,
    data: UpdateAccountHeadInput,
    include?: any,
  ) {
    return super.updateById(
      id,
      {
        name: data.name,
        code: data.code,
        description: data.description,
        openingBalance: data.openingBalance,
        parentId: data.parentId,
        isControlAccount: data.isControlAccount,
      },
      include,
    );
  }

  public async updateByAdmin(
    id: string,
    data: UpdateAccountHeadInput,
    include?: any,
  ) {
    console.log({ data });
    return super.updateById(id, data, include);
  }

  public async deleteById(id: string) {
    return super.deleteById(id);
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
