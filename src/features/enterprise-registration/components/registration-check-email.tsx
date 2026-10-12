import { useState, useEffect } from "react";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { AuthStatusCard } from "@/features/auth/auth-status-card";
import { AUTH_ACTION_CLASS, AUTH_ACTION_DISABLED_CLASS, MS_PER_SECOND, RESEND_COOLDOWN_SECONDS } from "@/features/auth/auth-status.constants";

const STRONG = { strong: <strong className="font-semibold text-foreground" /> };

export function RegistrationCheckEmail({
  email,
  onResend,
  onChangeEmail,
}: {
  email: string;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
}) {
  const { t } = useTranslation();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), MS_PER_SECOND);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthStatusCard>
      <StatusPanel
        actions={
          <Button
            className={`${AUTH_ACTION_CLASS} ${AUTH_ACTION_DISABLED_CLASS}`}
            disabled={cooldown > 0 || isResending}
            onClick={handleResend}
            shape="xl"
            type="button"
            variant="outline"
          >
            {isResending ? <RefreshCw aria-hidden className="animate-spin" /> : null}
            {cooldown > 0 ? t("enterpriseRegistration.checkEmail.resendIn", { seconds: cooldown }) : t("enterpriseRegistration.checkEmail.resend")}
          </Button>
        }
        description={<Trans components={STRONG} i18nKey="enterpriseRegistration.checkEmail.body" values={{ email }} />}
        footer={
          <button className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-fg-link hover:underline" onClick={onChangeEmail} type="button">
            <ArrowLeft aria-hidden className="size-3.5" />
            {t("enterpriseRegistration.checkEmail.changeEmail")}
          </button>
        }
        icon={Mail}
        note={t("enterpriseRegistration.checkEmail.tip")}
        title={t("enterpriseRegistration.checkEmail.title")}
        tone="brand"
      />
    </AuthStatusCard>
  );
}
