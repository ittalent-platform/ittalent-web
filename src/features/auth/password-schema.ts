import { z } from "zod";

import { validationMessage } from "./auth-validation";

export const passwordMessage = validationMessage("auth.validation.passwordStrength");

export const strongPasswordSchema = z
  .string()
  .min(8, passwordMessage)
  .max(64, passwordMessage)
  .regex(/[a-z]/, validationMessage("auth.validation.passwordLowercase"))
  .regex(/[A-Z]/, validationMessage("auth.validation.passwordUppercase"))
  .regex(/[0-9]/, validationMessage("auth.validation.passwordNumber"))
  .regex(/[^A-Za-z0-9]/, validationMessage("auth.validation.passwordSpecial"));
