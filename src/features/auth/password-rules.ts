export const PASSWORD_RULES = [
  { label: "8–64 chars", test: (value: string) => value.length >= 8 && value.length <= 64 },
  { label: "Uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
  { label: "!@#$%^&*", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export function getPasswordRules(password: string, confirmPassword: string) {
  return [
    ...PASSWORD_RULES.map(({ label, test }) => ({ label, ok: test(password) })),
    { label: "Match", ok: confirmPassword.length > 0 && password === confirmPassword },
  ];
}
