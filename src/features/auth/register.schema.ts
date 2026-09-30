import { z } from "zod";

import { validationMessage } from "./auth-validation";

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, validationMessage("auth.validation.fullNameMin"))
      .max(100, validationMessage("auth.validation.fullNameMax")),
    email: z.string().email(validationMessage("auth.validation.emailInvalid")).trim().toLowerCase(),
    username: z
      .string()
      .min(3, validationMessage("auth.validation.usernameMin"))
      .max(30, validationMessage("auth.validation.usernameMax"))
      .regex(/^[a-zA-Z0-9_]+$/, validationMessage("auth.validation.usernameChars"))
      .trim()
      .toLowerCase(),
    mobile: z
      .string()
      .trim()
      .regex(/^(\+?[0-9]{10,15})?$/, validationMessage("auth.validation.mobileDigits"))
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, validationMessage("auth.validation.passwordMin")),
    confirmPassword: z.string().min(1, validationMessage("auth.validation.confirmPasswordRequired")),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, validationMessage("auth.validation.termsRequired")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    ...validationMessage("auth.validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
