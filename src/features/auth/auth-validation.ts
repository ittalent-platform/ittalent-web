import i18n from "@/i18n";

// Zod messages are resolved when a value is validated, so they follow the active language.
export function validationMessage(key: string) {
  return { error: () => i18n.t(key) };
}
