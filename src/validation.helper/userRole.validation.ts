import { z } from "zod";
// Role validation
export const roleSchema = z.enum(["user", "admin"]);
