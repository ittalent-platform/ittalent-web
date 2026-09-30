import { Mail } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";

import { InlineBanner } from "@/components/common/inline-banner";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";

import { AuthCardPage, AuthStatusCard } from "./auth-status-card";
import { AUTH_ACTION_CLASS } from "./auth-status.constants";
import { ResendBanners, ResendButton } from "./resend-button";
import { useResendVerification } from "./use-resend-verification";

const STRONG = { strong: <strong className="font-semibold text-foreground" /> };
const STEP_KEYS = ["step1", "step2", "step3"] as const;

/** "Check your email" after sign up: steps, resend with cooldown and limit, and a way back to sign up. */
export function CheckEmailScreen({ deliveryFailed = false, email }: { deliveryFailed?: boolean; email?: string }) {
  const { t } = useTranslation();
  const resend = useResendVerification();

  return (
    <AuthCardPage>
      <AuthStatusCard>
        <StatusPanel
          actions={
            <>
              <Button asChild className={AUTH_ACTION_CLASS} shape="xl" variant="outline">
                <Link to="/login">{t("auth.verify.goToSignIn")}</Link>
              </Button>
              <ResendButton
                idleLabel={t("auth.verify.resend")}
                onResend={() => email && void resend.resend(email)}
                resend={resend}
              />
            </>
          }
          description={
            email ? (
              <Trans components={STRONG} i18nKey="auth.verify.checkEmail.body" values={{ email }} />
            ) : (
              t("auth.verify.checkEmail.bodyNoEmail")
            )
          }
          footer={
            <>
              {t("auth.verify.checkEmail.wrongEmail")}{" "}
              <Link className="font-semibold text-fg-link hover:underline" to="/register">
                {t("auth.verify.checkEmail.signUpAgain")}
              </Link>
            </>
          }
          icon={Mail}
          note={t("auth.verify.checkEmail.note")}
          steps={STEP_KEYS.map((key) => (
            <Trans components={STRONG} i18nKey={`auth.verify.checkEmail.${key}`} key={key} />
          ))}
          title={t("auth.verify.checkEmail.title")}
          tone="brand"
        >
          {deliveryFailed && resend.sent === 0 ? (
            <InlineBanner tone="warning">{t("auth.verify.checkEmail.deliveryFailed")}</InlineBanner>
          ) : null}
          <ResendBanners resend={resend} />
        </StatusPanel>
      </AuthStatusCard>
    </AuthCardPage>
  );
}
