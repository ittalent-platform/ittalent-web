import { z } from "zod";

export const passwordMessage =
  "Password must be 8 to 64 characters and contain uppercase, lowercase, number, and special character";

export const strongPasswordSchema = z
  .string()
  .min(8, passwordMessage)
  .max(64, passwordMessage)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");
