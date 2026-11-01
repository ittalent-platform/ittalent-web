import { Button } from "@/components/ui/button";
import type { ResendVerification } from "@/hooks/use-resend-verification";

import { AUTH_ACTION_CLASS, AUTH_ACTION_DISABLED_CLASS } from "./auth-status.constants";

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
  return (
    <Button
      className={`${AUTH_ACTION_CLASS} ${AUTH_ACTION_DISABLED_CLASS}`}
      disabled={resend.cooling || resend.loading}
      onClick={onResend}
      shape="xl"
      type="button"
      variant={variant}
    >
      {resend.label(idleLabel)}
    </Button>
  );
}
