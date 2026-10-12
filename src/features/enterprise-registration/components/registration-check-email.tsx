import { useState, useEffect } from "react";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
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
    <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--status-warning-bg) text-(--status-warning-fg)">
        <Mail className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-foreground">
        Check your work email
      </h2>

      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
        We sent a verification link to{" "}
        <span className="font-semibold text-foreground">{email}</span>. Click the link
        to verify your corporate email and start your registration draft.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={cooldown > 0 || isResending}
          onClick={handleResend}
          className="w-full"
        >
          {isResending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {cooldown > 0 ? `Resend link in ${cooldown}s` : "Resend verification link"}
        </Button>

        <button
          type="button"
          onClick={onChangeEmail}
          className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Use a different email address
        </button>
      </div>

      <div className="mt-6 border-t border-line-muted pt-4 text-xs text-muted-foreground">
        Tip: If you don't see the email within 2 minutes, check your spam or junk folder.
      </div>
    </div>
  );
}
