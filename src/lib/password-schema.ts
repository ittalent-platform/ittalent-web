import { z } from "zod";

import { PASSWORD_ALLOWED_SPECIAL_CHARACTERS } from "./password-rules";
import { validationMessage } from "./validation-message";

export const passwordMessage = validationMessage(
  "auth.validation.passwordStrength",
);

export const strongPasswordSchema = z
  .string()
  .min(8, passwordMessage)
  .max(64, passwordMessage)
  .regex(/[a-z]/, validationMessage("auth.validation.passwordLowercase"))
  .regex(/[A-Z]/, validationMessage("auth.validation.passwordUppercase"))
  .regex(/[0-9]/, validationMessage("auth.validation.passwordNumber"))
  .regex(
    /[!@#$%^&*]/,
    validationMessage("auth.validation.passwordSpecial", {
      characters: PASSWORD_ALLOWED_SPECIAL_CHARACTERS,
    }),
  );
