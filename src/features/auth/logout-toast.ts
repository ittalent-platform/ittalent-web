import type { ToastInput } from "@/components/toast/toast-provider";

export function getLogoutSuccessToast(): ToastInput {
  return {
    dismissLabel: "Dismiss",
    message: "You've been signed out.",
    title: "Logged out — landed on public page",
    tone: "success",
  };
}

export function getLogoutExpiredToast(): ToastInput {
  return {
    dismissLabel: "Dismiss",
    message: "Your session has expired. Please sign in again.",
    title: "Session already expired",
    tone: "warning",
  };
}

export function getLogoutFailureToast(): ToastInput {
  return {
    dismissLabel: "Dismiss",
    message: "Something went wrong signing you out. Please try again.",
    title: "Logout failed (safe retry)",
    tone: "error",
  };
}
