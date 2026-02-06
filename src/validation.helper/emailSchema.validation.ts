import { z } from "zod";

// Email validation helper
export const emailSchema = z
  .email("Invalid email address")
  .min(5, "Email must be at least 5 characters")
  .max(255, "Email must not exceed 255 characters")
  .toLowerCase()
  .trim();
