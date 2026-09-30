import { z } from "zod";

import { validationMessage } from "./auth-validation";

export const loginSchema = z.object({
  identifier: z.string().min(1, validationMessage("auth.validation.identifierRequired")).trim(),
  password: z.string().min(1, validationMessage("auth.validation.passwordRequired")),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
