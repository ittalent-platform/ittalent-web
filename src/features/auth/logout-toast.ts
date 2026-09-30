import i18n from "@/i18n";
import type { ToastInput } from "@/components/toast/toast-provider";

export function getLogoutSuccessToast(): ToastInput {
  return {
    dismissLabel: i18n.t("auth.logout.dismiss"),
    message: i18n.t("auth.logout.successMessage"),
    title: i18n.t("auth.logout.successTitle"),
    tone: "success",
  };
}

export function getLogoutExpiredToast(): ToastInput {
  return {
    dismissLabel: i18n.t("auth.logout.dismiss"),
    message: i18n.t("auth.logout.expiredMessage"),
    title: i18n.t("auth.logout.expiredTitle"),
    tone: "warning",
  };
}

export function getLogoutFailureToast(): ToastInput {
  return {
    dismissLabel: i18n.t("auth.logout.dismiss"),
    message: i18n.t("auth.logout.failureMessage"),
    title: i18n.t("auth.logout.failureTitle"),
    tone: "error",
  };
}
