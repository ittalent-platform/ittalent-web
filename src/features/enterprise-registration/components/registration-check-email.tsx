import { useState, useEffect } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { MS_PER_SECOND, RESEND_COOLDOWN_SECONDS } from "@/features/auth/auth-status.constants";

const STRONG = { strong: <strong className="font-semibold text-foreground" /> };
const STEP_KEYS = ["step1", "step2", "step3"] as const;
const ACTION_CLASS = "h-12 w-full rounded-xl text-[14.5px] font-semibold";

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
    <div className="flex w-full flex-col gap-[22px]">
      <span className="flex size-16 shrink-0 items-center justify-center rounded-[18px] bg-(--status-peach-bg) text-(--status-peach-fg)">
        <Mail aria-hidden className="size-7" />
      </span>

      <div className="flex flex-col gap-2.5">
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.01em] text-foreground sm:text-[30px]">{t("enterpriseRegistration.checkEmail.title")}</h1>
        <p className="text-[14.5px] leading-[1.6] text-muted-foreground">
          <Trans components={STRONG} i18nKey="enterpriseRegistration.checkEmail.body" values={{ email }} />
        </p>
      </div>

      <ol className="m-0 flex list-none flex-col gap-3 rounded-[14px] border border-border bg-card px-[18px] py-4 text-left">
        {STEP_KEYS.map((key, index) => (
          <li className="flex items-start gap-3" key={key}>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{index + 1}</span>
            <span className="pt-0.5 text-[13.5px] leading-[1.55] text-foreground/90">
              <Trans components={STRONG} i18nKey={`enterpriseRegistration.checkEmail.${key}`} />
            </span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-3">
        <Button className={ACTION_CLASS} onClick={onChangeEmail} type="button" variant="outline">
          {t("enterpriseRegistration.checkEmail.changeEmail")}
        </Button>
        <Button className={ACTION_CLASS} disabled={cooldown > 0 || isResending} onClick={handleResend} type="button">
          {isResending ? <RefreshCw aria-hidden className="animate-spin" /> : null}
          {cooldown > 0 ? t("enterpriseRegistration.checkEmail.resendIn", { seconds: cooldown }) : t("enterpriseRegistration.checkEmail.resend")}
        </Button>
      </div>

      <p className="text-[12.5px] leading-[1.55] text-muted-foreground">{t("enterpriseRegistration.checkEmail.tip")}</p>
    </div>
  );
}
