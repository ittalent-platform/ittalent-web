import { z } from "zod";
import { strongPasswordSchema } from "./password-schema";

export const resetPasswordSchema = z
  .object({
    confirmPassword: strongPasswordSchema,
    newPassword: strongPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Confirm password must match password",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
