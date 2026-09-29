export const forgotPasswordPath = "/forgot-password";
export const resetPasswordPath = "/reset-password";

export function getPasswordResetCallbackURL() {
  if (typeof window === "undefined") {
    return resetPasswordPath;
  }

  return new URL(resetPasswordPath, window.location.origin).toString();
}
