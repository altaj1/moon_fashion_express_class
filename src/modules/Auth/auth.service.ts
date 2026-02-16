// src/modules/Auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { BaseService } from "@/core/BaseService";
import { AppLogger } from "@/core/logging/logger";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  BadRequestError,
  AppError,
} from "@/core/errors/AppError";
import { config } from "@/core/config";
import { JWTPayload } from "@/middleware/auth";
import { SESEmailService } from "@/services/SESEmailService";
import { OTPService, OTPType } from "../../services/otp.service";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendEmailVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
  VerifyResetPasswordOTPInput,
} from "./auth.validation";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";
import {
  PrismaClient,
  User,
  UserAccountStatus,
  UserRole,
} from "@/generated/prisma/client";
import { sendImageToCloudinary } from "@/utils/sendImageToCloudinery";

export interface AuthResponse {
  user: Omit<User, "password">;
  token: string;
  expiresIn: string;
}

export interface TokenInfo {
  userId: string;
  email: string;
  role: string;
}

export class AuthService extends BaseService<User> {
  private readonly SALT_ROUNDS = 12;
  private otpService: OTPService;

  constructor(prisma: PrismaClient) {
    super(prisma, "User", {
      enableSoftDelete: true, // Schema has deletedAt/isDeleted
      enableAuditFields: true,
    });

    // Initialize OTP service
    this.otpService = new OTPService(this.prisma, new SESEmailService());
  }

  protected getModel() {
    return this.prisma.user;
  }

  /**
   * Register a new user
   */
  async register(
    data: RegisterInput,
    avatarFile: Express.Multer.File | undefined,
  ): Promise<{ message: string; requiresVerification: boolean }> {
    const {
      email,
      password,
      firstName,
      lastName,
      username,
      role = UserRole.user,
      designation,
      modules = [],
    } = data;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
      },
    });

    if (existingUser) {
      const conflictField = existingUser.email === email ? "email" : "username";
      throw new ConflictError(`User with this ${conflictField} already exists`);
    }
    const uploadedAvatarUrl = await sendImageToCloudinary(
      `${data.firstName}_${data.lastName}`,
      avatarFile?.path || "",
      "user_avatars",
    );

    // Hash password
    const hashedPassword = await this.hashPassword(
      password || config.defaultUser.password || "",
    );

    // Create user with pending verification status
    const user = await this.create({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      role,
      avatarUrl: uploadedAvatarUrl.secure_url || "",
      status: UserAccountStatus.pending_verification,
      designation,
      modules,
    });

    // Send OTP for email verification
    this.otpService
      .sendOTP({
        identifier: email,
        type: OTPType.email_verification,
        userId: user.id,
      })
      .catch((error) => {
        AppLogger.error(
          "Failed to send verification email after registration",
          {
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        );
      });

    return {
      message:
        "Registration successful. Please check your email for verification.",
      requiresVerification: true,
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(data: VerifyEmailInput): Promise<AuthResponse> {
    const { email, code } = data;

    const user = await this.findOne({ email });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.status === UserAccountStatus.active) {
      throw new BadRequestError("Email already verified");
    }

    const otpResult = await this.otpService.verifyOTP({
      identifier: email,
      code,
      type: OTPType.email_verification,
    });

    if (!otpResult.success) {
      throw new BadRequestError("Invalid or expired verification code");
    }

    const updatedUser = await this.updateById(user.id, {
      status: UserAccountStatus.active,
      emailVerifiedAt: new Date(),
    });

    AppLogger.info("Email verified successfully", {
      userId: user.id,
      email: user.email,
    });

    return this.generateAuthResponse(updatedUser);
  }

  /**
   * Resend email verification OTP
   */
  async resendEmailVerification(
    data: ResendEmailVerificationInput,
  ): Promise<{ message: string }> {
    const { email } = data;

    const user = await this.findOne({ email });
    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.status === UserAccountStatus.active) {
      throw new BadRequestError("Email already verified");
    }

    await this.otpService.sendOTP({
      identifier: email,
      type: OTPType.email_verification,
      userId: user.id,
    });

    AppLogger.info("Email verification OTP resent", {
      userId: user.id,
      email: user.email,
    });

    return {
      message: "Verification code sent to your email",
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const { email, password } = data;

    const user = await this.findOne({ email });
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    // if (user.status === UserAccountStatus.pending_verification) {
    //     throw new AuthenticationError('Please verify your email first', {
    //         requiresVerification: true,
    //     });
    // }

    // if (user.status !== UserAccountStatus.active) {
    //     throw new AuthenticationError(`Account is ${user.status.replace('_', ' ')}`);
    // }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      AppLogger.warn("Failed login attempt", { email, userId: user.id });
      throw new AuthenticationError("Invalid email or password");
    }

    await this.updateById(user.id, { lastLoginAt: new Date() });

    AppLogger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return this.generateAuthResponse(user);
  }

  /**
   * Forgot password
   */
  async forgotPassword(
    data: ForgotPasswordInput,
  ): Promise<{ message: string }> {
    const { email } = data;

    const user = await this.findOne({ email });
    if (!user || user.status !== UserAccountStatus.active) {
      // Generic message for security
      return {
        message:
          "If an account with this email exists, you will receive a password reset code.",
      };
    }

    try {
      await this.otpService.sendOTP({
        identifier: email,
        type: OTPType.password_reset,
        userId: user.id,
      });

      AppLogger.info("Password reset OTP sent", {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      AppLogger.error("Failed to send password reset OTP", {
        userId: user.id,
        email: user.email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return {
      message:
        "If an account with this email exists, you will receive a password reset code.",
    };
  }

  /**
   * Verify reset password OTP
   */
  async verifyResetPasswordOTP(
    data: VerifyResetPasswordOTPInput,
  ): Promise<{ message: string }> {
    const { email, code } = data;

    const user = await this.findOne({ email });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const otpResult = await this.otpService.verifyOTP({
      identifier: email,
      code,
      type: OTPType.password_reset,
    });

    if (!otpResult.success) {
      throw new BadRequestError("Invalid or expired reset code");
    }

    AppLogger.info("Password reset OTP verified", {
      userId: user.id,
      email: user.email,
    });

    return {
      message: "Code verified. You can now reset your password.",
    };
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const { email, newPassword, currentPassword } = data;

    const user = await this.findOne({ email });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (!newPassword) {
      throw new BadRequestError("New password is required");
    }
    // Verify that there is a verified OTP for this email
    // const hasVerifiedOTP = await this.hasVerifiedOTP(email, OTPType.password_reset);
    // if (!hasVerifiedOTP) {
    //     throw new BadRequestError('Password reset code not verified or expired');
    // }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.updateById(user.id, { password: hashedPassword });

    // Cleanup after success
    // await this.otpService.cleanupUserOTPs(email);

    AppLogger.info("Password reset completed", {
      userId: user.id,
      email: user.email,
    });

    return {
      message: "Password reset successfully. You can now log in.",
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findOne({ email });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const isValidPassword = await this.verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      throw new AuthenticationError("Current password is incorrect");
    }

    const hashedNewPassword = await this.hashPassword(newPassword);
    await this.updateById(user.id, { password: hashedNewPassword });

    AppLogger.info("Password changed successfully", { userId: user.id });

    return { message: "Password changed successfully" };
  }

  /**
   * Get profile
   */
  async getProfile(userId: string): Promise<Omit<User, "password">> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    newRole: UserRole,
  ): Promise<Omit<User, "password">> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await this.updateById(userId, { role: newRole });

    AppLogger.info("User role updated", {
      userId,
      oldRole: user.role,
      newRole,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Refresh token
   */
  async refreshToken(currentToken: string): Promise<AuthResponse> {
    try {
      if (!config.security.jwt.secret) {
        throw new AuthenticationError("JWT configuration missing");
      }

      const decoded = jwt.verify(
        currentToken,
        config.security.jwt.secret,
      ) as JWTPayload;
      const user = await this.findById(decoded.id);

      if (!user || user.status !== UserAccountStatus.active) {
        throw new AuthenticationError("Session invalid or account inactive");
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      throw new AuthenticationError("Invalid or expired refresh token");
    }
  }

  /**
   * Verify JWT
   */
  async verifyToken(token: string): Promise<TokenInfo> {
    try {
      if (!config.security.jwt.secret) {
        throw new AuthenticationError("JWT configuration missing");
      }

      const decoded = jwt.verify(
        token,
        config.security.jwt.secret,
      ) as JWTPayload;
      const user = await this.findById(decoded.id);

      if (!user || user.status !== UserAccountStatus.active) {
        throw new AuthenticationError("User not found or inactive");
      }

      return {
        userId: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      throw new AuthenticationError("Invalid or expired token");
    }
  }

  /**
   * Stats for admin
   */
  async getAuthStats() {
    const [total, active, admin] = await Promise.all([
      this.count(),
      this.count({ status: UserAccountStatus.active }),
      this.count({ role: UserRole.admin }),
    ]);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await this.count({ createdAt: { gte: weekAgo } });

    return {
      totalUsers: total,
      activeUsers: active,
      adminUsers: admin,
      regularUsers: total - admin,
      recentRegistrations: recent,
    };
  }

  // Helpers

  private generateAuthResponse(user: User): AuthResponse {
    if (!config.security.jwt.secret) {
      throw new AuthenticationError("JWT secret missing");
    }

    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = config.security.jwt.expiresIn || "1d";
    const token = jwt.sign(payload, config.security.jwt.secret);

    const { password, ...safeUser } = user;

    return { user: safeUser, token, expiresIn };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private async verifyPassword(
    plain: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  private async hasVerifiedOTP(
    identifier: string,
    type: OTPType,
  ): Promise<boolean> {
    const otp = await this.prisma.oTP.findFirst({
      where: { identifier, type, verified: true },
      orderBy: { createdAt: "desc" },
    });
    return !!otp;
  }
}
