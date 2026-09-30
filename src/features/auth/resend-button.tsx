import { useTranslation } from "react-i18next";

import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";

import { AUTH_ACTION_CLASS, AUTH_ACTION_DISABLED_CLASS } from "./auth-status.constants";
import { formatCooldown, type ResendVerification } from "./use-resend-verification";

/** Resend action with the design's states: idle label, "Resend again in m:ss", "Resend limit reached". */
export function ResendButton({
  idleLabel,
  onResend,
  resend,
  variant = "default",
}: {
  idleLabel: string;
  onResend: () => void;
  resend: ResendVerification;
  variant?: "default" | "outline";
}) {
  const { t } = useTranslation();
  const label = resend.limited
    ? t("auth.verify.resendLimitReached")
    : resend.secondsLeft > 0
      ? t("auth.verify.resendAgainIn", { time: formatCooldown(resend.secondsLeft) })
      : resend.loading
        ? t("auth.verify.sending")
        : idleLabel;
  return (
    <Button
      className={`${AUTH_ACTION_CLASS} ${AUTH_ACTION_DISABLED_CLASS}`}
      disabled={resend.cooling || resend.loading}
      onClick={onResend}
      shape="xl"
      type="button"
      variant={variant}
    >
      {label}
    </Button>
  );
}

/** Banners under a resend action: success after a send, the limit warning, or the server's error. */
export function ResendBanners({ announceAfter = 0, resend }: { announceAfter?: number; resend: ResendVerification }) {
  const { t } = useTranslation();
  return (
    <>
      {resend.sent > announceAfter && !resend.limited ? (
        <InlineBanner tone="success">{t("auth.verify.resendSent")}</InlineBanner>
      ) : null}
      {resend.limited ? <InlineBanner tone="warning">{t("auth.verify.resendLimited")}</InlineBanner> : null}
      {resend.errorMessage ? <InlineBanner tone="error">{resend.errorMessage}</InlineBanner> : null}
    </>
  );
}
