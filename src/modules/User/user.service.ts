import { sendImageToCloudinary } from "./../../utils/sendImageToCloudinery";
import { BaseService } from "@/core/BaseService";
import { PrismaClient, UserRole } from "@/generated/prisma/client";
import { PaginationOptions } from "@/types/types";
import { UpdateUserInput } from "./user.validation";
import { User } from "@/generated/prisma/client";
import { NotFoundError } from "@/core/errors/AppError";
import { AppLogger } from "@/core/logging/logger";
import { UserAccountStatus } from "@/generated/prisma/client";
import { fi } from "zod/v4/locales";
export class UserService extends BaseService<any, UpdateUserInput> {
  constructor(prisma: PrismaClient) {
    super(prisma, "User", {
      enableSoftDelete: true,
      enableAuditFields: true,
    });
  }

  protected getModel() {
    return this.prisma.user;
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

  async updateProfile(
    userId: string | undefined,
    data: UpdateUserInput,
    avatarFile?: Express.Multer.File,
  ): Promise<Omit<User, "password">> {
    if (!userId) {
      throw new NotFoundError("User ID is required");
    }
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (!avatarFile?.path) {
      throw new Error("Avatar file is missing");
    }

    const uploadedAvatarUrl = await sendImageToCloudinary(
      `${data.firstName}_${data.lastName}`,
      avatarFile?.path,
      "user_avatars",
    );

    // Calculate display name if names changed
    const firstName = data.firstName ?? user.firstName;
    const lastName = data.lastName ?? user.lastName;
    const displayName = `${firstName} ${lastName}`;

    const updatedUser = await this.updateById(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      avatarUrl: uploadedAvatarUrl.secure_url || "",
      displayName,
    });

    AppLogger.info("User profile updated", { userId });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    newRole: UserRole,
    newStatus: UserAccountStatus,
  ): Promise<Omit<User, "password">> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await this.updateById(userId, {
      role: newRole,
      status: newStatus,
    });

    AppLogger.info("User role updated", {
      userId,
      oldRole: user.role,
      newRole,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  public async softDelete(data: any): Promise<any> {
    const { id, isDeleted } = data;
    return super.updateById(id, {
      isDeleted,
      deletedAt: isDeleted ? new Date() : null,
    });
  }

  public async exists(filters: any) {
    return super.exists(filters);
  }
}
