import { useTranslation } from "react-i18next";

import { InlineBanner } from "./inline-banner";
import type { ResendVerification } from "@/hooks/use-resend-verification";

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
