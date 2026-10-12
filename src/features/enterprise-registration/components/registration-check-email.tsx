import { useState, useEffect } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegistrationCheckEmail({
  email,
  onResend,
  onChangeEmail,
}: {
  email: string;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
}) {
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-8 shadow-xs">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--status-warning-bg) text-(--status-warning-fg)">
        <Mail className="h-7 w-7" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Check your email
      </h2>

      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        We sent a confirmation link to{" "}
        <span className="font-semibold text-foreground">{email}</span>.
      </p>

      {/* 3-step numbered card */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-background/50 p-4 text-left">
        <div className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            1
          </span>
          <span className="text-[13px] text-foreground">
            Open the email from <strong>ITTalent</strong>.
          </span>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            2
          </span>
          <span className="text-[13px] text-foreground">
            Select <strong>Confirm work email</strong>. The link works once and expires in 24 hours.
          </span>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            3
          </span>
          <span className="text-[13px] text-foreground">
            You land on your registration draft. No password needed.
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onChangeEmail}
          className="w-full"
        >
          Change email
        </Button>

        <Button
          type="button"
          disabled={cooldown > 0 || isResending}
          onClick={handleResend}
          className="w-full"
        >
          {isResending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend email"}
        </Button>
      </div>

      <p className="mt-6 text-[12.5px] leading-relaxed text-muted-foreground">
        Can&apos;t find it? Check Spam or Promotions. Resend is limited to 3 times per 24 hours, one minute apart.
      </p>
    </div>
  );
}
