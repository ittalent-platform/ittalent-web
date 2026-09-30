export const PASSWORD_RULES = [
  { id: "length", test: (value: string) => value.length >= 8 && value.length <= 64 },
  { id: "uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lowercase", test: (value: string) => /[a-z]/.test(value) },
  { id: "number", test: (value: string) => /[0-9]/.test(value) },
  { id: "special", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

// `id` maps to the `auth.password.rule.<id>` label.
export function getPasswordRules(password: string, confirmPassword: string) {
  return [
    ...PASSWORD_RULES.map(({ id, test }) => ({ id: id as string, ok: test(password) })),
    { id: "match", ok: confirmPassword.length > 0 && password === confirmPassword },
  ];
}
