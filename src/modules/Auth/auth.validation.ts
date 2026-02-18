// src/modules/Auth/auth.validation.ts
import { z } from "zod";
import { emailSchema } from "@/validation.helper/emailSchema.validation";
import { roleSchema } from "@/validation.helper/userRole.validation";

// Define allowed modules enum
const moduleEnum = z.enum([
  "dashboard",
  "companyProfile",
  "users",
  "buyers",
  "orders",
  "accounts",
  "invoiceTerms",
  "piManagement",
  "lcManagement",
]);

// Password validation with security requirements
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
  .regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
  .regex(/^(?=.*\d)/, "Password must contain at least one number")
  .optional();

// OTP code validation
const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP code must be exactly 6 digits")
  .transform((val) => val.trim());

export const AuthValidation = {
  // Registration validation - Adjusted to match Prisma schema (firstName/lastName are required)
  register: z
    .object({
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: z.string().optional(),
      firstName: z
        .string()
        .min(2, "First name must be at least 2 characters")
        .max(100, "First name must not exceed 100 characters")
        .trim(),
      lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters")
        .max(100, "Last name must not exceed 100 characters")
        .trim(),
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must not exceed 50 characters")
        .trim()
        .optional(),
      role: roleSchema.optional(),
      designation: z
        .string()
        .min(3, "Designation must be at least 3 characters")
        .max(50, "Designation must not exceed 50 characters")
        .trim(),
      modules: z
        .array(moduleEnum)
        .min(1, "At least one module must be selected"),
      // .optional(),
      avatarUrl: z.string().url("Invalid URL format").optional(),
    })
    .strict()
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
    .transform((data) => {
      const { confirmPassword, ...rest } = data;
      return rest;
    }),

  // Login validation
  login: z
    .object({
      email: emailSchema,
      password: z.string().min(1, "Password is required"),
    })
    .strict(),

  // Email verification validation
  verifyEmail: z
    .object({
      email: emailSchema,
      code: otpCodeSchema,
    })
    .strict(),

  // Resend email verification validation
  resendEmailVerification: z
    .object({
      email: emailSchema,
    })
    .strict(),

  // Change password validation
  changePassword: z
    .object({
      email: emailSchema,
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: passwordSchema,
      confirmNewPassword: z.string(),
    })
    .strict()
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "New passwords do not match",
      path: ["confirmNewPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    })
    .transform((data) => {
      const { confirmNewPassword, ...rest } = data;
      return rest;
    }),

  // Update role validation (admin only)
  updateRole: z
    .object({
      role: roleSchema,
    })
    .strict(),

  // Refresh token validation
  refreshToken: z
    .object({
      token: z.string().min(1, "Token is required").optional(),
    })
    .strict(),

  // Forgot password validation
  forgotPassword: z
    .object({
      email: emailSchema,
    })
    .strict(),

  // Password reset validation
  verifyResetPasswordOTPInput: z
    .object({
      email: emailSchema,
      code: otpCodeSchema,
    })
    .strict(),

  // Reset password validation
  resetPassword: z
    .object({
      email: emailSchema,
      newPassword: passwordSchema,
      currentPassword: z.string().min(1, "Current password is required"),
    })
    .strict(),

  // Parameter validation
  params: {
    userId: z.object({
      userId: z
        .string()
        .min(1, "User ID is required")
        .uuid("User ID must be a valid UUID"),
    }),
  },
};

export type RegisterInput = z.infer<typeof AuthValidation.register>;
export type LoginInput = z.infer<typeof AuthValidation.login>;
export type VerifyEmailInput = z.infer<typeof AuthValidation.verifyEmail>;
export type ResendEmailVerificationInput = z.infer<
  typeof AuthValidation.resendEmailVerification
>;
export type ChangePasswordInput = z.infer<typeof AuthValidation.changePassword>;
export type UpdateRoleInput = z.infer<typeof AuthValidation.updateRole>;
export type RefreshTokenInput = z.infer<typeof AuthValidation.refreshToken>;
export type ForgotPasswordInput = z.infer<typeof AuthValidation.forgotPassword>;
export type VerifyResetPasswordOTPInput = z.infer<
  typeof AuthValidation.verifyResetPasswordOTPInput
>;
export type ResetPasswordInput = z.infer<typeof AuthValidation.resetPassword>;
export type UserIdParams = z.infer<typeof AuthValidation.params.userId>;
