import { z } from "zod";

import { validationMessage } from "./auth-validation";
import { strongPasswordSchema } from "./password-schema";

export const resetPasswordSchema = z
  .object({
    confirmPassword: strongPasswordSchema,
    newPassword: strongPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    ...validationMessage("auth.validation.confirmPasswordMatch"),
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
