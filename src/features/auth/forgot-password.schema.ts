import { z } from "zod";

import { validationMessage } from "./auth-validation";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, validationMessage("auth.validation.emailRequired"))
    .email(validationMessage("auth.validation.emailInvalid")),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
