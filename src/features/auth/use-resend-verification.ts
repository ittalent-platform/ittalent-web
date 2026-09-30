import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { postApiV1AuthResendVerificationEmail } from "@/api/generated";

import { getAuthErrorMessage } from "./auth-utils";
import { MS_PER_SECOND, RESEND_COOLDOWN_SECONDS, RESEND_LIMIT, SECONDS_PER_MINUTE } from "./auth-status.constants";

type ResendStatus = "idle" | "loading" | "error";

/** "m:ss" for the resend countdown label. */
export function formatCooldown(seconds: number): string {
  return `${Math.floor(seconds / SECONDS_PER_MINUTE)}:${String(seconds % SECONDS_PER_MINUTE).padStart(2, "0")}`;
}

/**
 * Sends the verification email again and tracks the policy the design shows: a one minute pause after each send and a
 * stop after three. `sent` counts successful sends made from this screen.
 */
export function useResendVerification() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ResendStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), MS_PER_SECOND);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const limited = sent >= RESEND_LIMIT;

  const resend = useCallback(
    async (email: string): Promise<boolean> => {
      setStatus("loading");
      setErrorMessage(null);
      try {
        const response = await postApiV1AuthResendVerificationEmail({ body: { email } });
        if (response.error) {
          setStatus("error");
          setErrorMessage(getAuthErrorMessage(response.error, t("auth.verify.resendError")));
          return false;
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage(getAuthErrorMessage(error, t("auth.verify.resendError")));
        return false;
      }
      setStatus("idle");
      setSent((value) => value + 1);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      return true;
    },
    [t],
  );

  return {
    cooling: secondsLeft > 0 || limited,
    errorMessage,
    limited,
    loading: status === "loading",
    resend,
    secondsLeft,
    sent,
  };
}

export type ResendVerification = ReturnType<typeof useResendVerification>;
