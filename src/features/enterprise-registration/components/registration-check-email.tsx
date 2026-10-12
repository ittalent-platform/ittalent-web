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
    <div className="flex w-full flex-col gap-[22px]">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-(--status-peach-bg) text-(--status-peach-fg)">
        <Mail className="h-7 w-7" />
      </span>

      <div className="flex flex-col gap-2.5">
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.01em] text-foreground sm:text-[30px]">
          Check your email
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-muted-foreground">
          We sent a confirmation link to{" "}
          <strong className="font-semibold text-foreground">{email}</strong>.
        </p>
      </div>

      {/* 3-step numbered card */}
      <ol className="m-0 flex list-none flex-col gap-3 rounded-[14px] border border-border bg-card p-[16px_18px] text-left">
        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            1
          </span>
          <span className="pt-0.5 text-[13.5px] leading-[1.55] text-foreground/90">
            Open the email from <strong>ITTalent</strong>.
          </span>
        </li>

        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            2
          </span>
          <span className="pt-0.5 text-[13.5px] leading-[1.55] text-foreground/90">
            Select <strong>Confirm work email</strong>. The link works once and expires in 24 hours.
          </span>
        </li>

        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            3
          </span>
          <span className="pt-0.5 text-[13.5px] leading-[1.55] text-foreground/90">
            You land on your registration draft. No password needed.
          </span>
        </li>
      </ol>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onChangeEmail}
          className="h-12 w-full rounded-xl text-[14.5px] font-semibold"
        >
          Change email
        </Button>

        <Button
          type="button"
          disabled={cooldown > 0 || isResending}
          onClick={handleResend}
          className="h-12 w-full rounded-xl text-[14.5px] font-semibold"
        >
          {isResending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend email"}
        </Button>
      </div>

      <p className="text-[12.5px] leading-[1.55] text-muted-foreground">
        Can&apos;t find it? Check Spam or Promotions. Resend is limited to 3 times per 24 hours, one minute apart.
      </p>
    </div>
  );
}
