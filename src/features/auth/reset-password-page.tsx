import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import {
  getApiV1AuthResetPassword,
  postApiV1AuthResetPassword,
} from "@/api/generated";

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "./reset-password.schema";
import { forgotPasswordPath } from "./password-reset";
import { getAuthErrorMessage } from "./auth-utils";
import { Button } from "@/components/ui/button";
import { getPasswordRules } from "./password-rules";
import { PasswordField } from "./password-field";
import { AuthCenteredShell } from "./auth-centered-shell";
import { AuthAlert } from "./auth-alert";

function PasswordRuleChips({
  confirmPassword,
  password,
}: {
  confirmPassword: string;
  password: string;
}) {
  const touched = password.length > 0 || confirmPassword.length > 0;

  return (
    <div className="flex flex-wrap gap-2" aria-live="polite">
      {getPasswordRules(password, confirmPassword).map((rule) => {
        const active = touched && rule.ok;
        const invalid = touched && !rule.ok;

        return (
          <span
            key={rule.label}
            className={[
              "rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-200",
              active
                ? "bg-(--status-success-bg) text-(--status-success-fg)"
                : invalid
                  ? "bg-(--status-error-bg) text-(--status-error-fg)"
                  : "bg-(--status-neutral-bg) text-(--status-neutral-fg)",
            ].join(" ")}
          >
            {rule.label} {touched ? (rule.ok ? "✓" : "×") : ""}
          </span>
        );
      })}
    </div>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const missingToken = token.length === 0;

  const [tokenStatus, setTokenStatus] = useState<
    "checking" | "valid" | "invalid" | "expired" | "error"
  >("checking");
  const [preflightAttempt, setPreflightAttempt] = useState(0);
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: "error" | "warning";
  } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: {
      confirmPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = useWatch({ control: form.control, name: "newPassword" }) ?? "";
  const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" }) ?? "";

  useEffect(() => {
    if (!token) {
      return;
    }

    let alive = true;

    getApiV1AuthResetPassword({ query: { token } })
      .then((response) => {
        if (!alive) return;
        if (response.data) {
          setTokenStatus("valid");
          return;
        }

        const code =
          typeof response.error === "object" &&
          response.error &&
          "code" in response.error
            ? (response.error as { code?: unknown }).code
            : undefined;
        const status = response.response?.status;

        if (code === "RESET_TOKEN_UNAVAILABLE" || status === 410) {
          setTokenStatus("expired");
        } else if (code === "INVALID_RESET_TOKEN" || status === 404) {
          setTokenStatus("invalid");
        } else {
          setTokenStatus("error");
        }
      })
      .catch(() => {
        if (alive) {
          setTokenStatus("error");
        }
      });

    return () => {
      alive = false;
    };
  }, [token, preflightAttempt]);

  async function onSubmit(values: ResetPasswordFormValues) {
    setFeedback(null);

    const response = await postApiV1AuthResetPassword({
      body: {
        newPassword: values.newPassword,
        token,
      },
    });

    if (response.error) {
      const code =
        typeof response.error === "object" &&
        response.error &&
        "code" in response.error
          ? (response.error as { code?: unknown }).code
          : undefined;
      const status = response.response?.status;

      if (code === "RESET_TOKEN_UNAVAILABLE" || status === 410) {
        setTokenStatus("expired");
        return;
      }
      if (code === "INVALID_RESET_TOKEN" || status === 404) {
        setTokenStatus("invalid");
        return;
      }

      const msg = getAuthErrorMessage(
        response.error,
        "Unable to reset your password right now.",
      );
      setFeedback({
        message: msg,
        variant: status === 429 ? "warning" : "error",
      });
      return;
    }

    setIsSuccess(true);
  }

  // 1. Success State: Card 4 (Password changed · all sessions signed out)
  if (isSuccess) {
    return (
      <AuthCenteredShell>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-(--status-success-bg) text-(--status-success-fg)"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>

          <h1 className="mt-1 font-['Space_Grotesk',sans-serif] text-[20px] font-semibold text-foreground">
            Password changed
          </h1>

          <p className="m-0 max-w-[400px] text-[13.5px] leading-[1.6] text-muted-foreground">
            Your email is verified too. You were signed out on every device, so sign in with the new password.
            <span className="sr-only">Password reset successful.</span>
          </p>

          <Link
            className="mt-2 flex h-11 items-center justify-center rounded-[12px] bg-primary px-6 text-[14px] font-semibold text-white no-underline transition hover:opacity-90"
            to="/login"
          >
            Sign in
          </Link>
        </div>
      </AuthCenteredShell>
    );
  }

  // 2. Missing Token or Invalid Link State: Card 5 (Expired, used or invalid link)
  if (missingToken || tokenStatus === "invalid") {
    return (
      <AuthCenteredShell>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-(--status-warning-bg) text-(--status-warning-fg)"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 6v6l4 2 M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0" />
            </svg>
          </span>

          <h1 className="mt-1 font-['Space_Grotesk',sans-serif] text-[20px] font-semibold text-foreground">
            This reset link can&apos;t be used
          </h1>

          <p className="m-0 max-w-[400px] text-[13.5px] leading-[1.6] text-muted-foreground">
            It has expired or was already used. Request a new one.
            <span className="sr-only">Invalid reset link</span>
          </p>

          <div className="mt-2 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link
              className="flex h-11 items-center justify-center rounded-[12px] border border-(--border-muted) bg-white px-5 text-[14px] font-semibold text-foreground no-underline transition hover:bg-(--surface-2)"
              to={forgotPasswordPath}
            >
              Request a new link
            </Link>

            <Link
              className="flex h-11 items-center justify-center rounded-[12px] border border-(--border-muted) bg-white px-5 text-[14px] font-semibold text-foreground no-underline transition hover:bg-(--surface-2)"
              to="/login"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthCenteredShell>
    );
  }

  // 3. Expired Link State
  if (tokenStatus === "expired") {
    return (
      <AuthCenteredShell>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-(--status-warning-bg) text-(--status-warning-fg)"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5V12l3.2 2" />
            </svg>
          </span>

          <h1 className="mt-1 font-['Space_Grotesk',sans-serif] text-[20px] font-semibold text-foreground">
            This reset link can&apos;t be used
          </h1>

          <p className="m-0 max-w-[400px] text-[13.5px] leading-[1.6] text-muted-foreground">
            This reset link has expired or was already used. Request a new password reset link to continue.
            <span className="sr-only">Link expired</span>
          </p>

          <Link
            className="mt-2 flex h-11 items-center justify-center rounded-[12px] border border-(--border-muted) bg-white px-5 text-[14px] font-semibold text-foreground no-underline transition hover:bg-(--surface-2)"
            to={forgotPasswordPath}
          >
            Request a new link
          </Link>
        </div>
      </AuthCenteredShell>
    );
  }

  // 4. Preflight Error State (Network / Server Error)
  if (tokenStatus === "error") {
    return (
      <AuthCenteredShell>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <h1 className="font-['Space_Grotesk',sans-serif] text-[20px] font-semibold text-foreground">
            Unable to check reset link
          </h1>

          <p className="m-0 max-w-[400px] text-[13.5px] leading-[1.6] text-muted-foreground">
            We encountered an error verifying your link. Please try again.
          </p>

          <Button
            className="mt-2 h-11 px-5"
            onClick={() => {
              setTokenStatus("checking");
              setPreflightAttempt((a) => a + 1);
            }}
            shape="xl"
            type="button"
          >
            Retry
          </Button>
        </div>
      </AuthCenteredShell>
    );
  }

  // 5. Checking Link State
  if (tokenStatus === "checking") {
    return (
      <AuthCenteredShell>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="size-10 animate-pulse rounded-full bg-(--primary-50)" />
          <p className="m-0 text-[14px] font-semibold text-muted-foreground">
            Checking reset link...
          </p>
        </div>
      </AuthCenteredShell>
    );
  }

  // 6. Set New Password Form: Card 3 (Set new password · from the link)
  return (
    <AuthCenteredShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[20px] font-semibold text-foreground">
            Set a new password
          </h1>
          <p className="m-0 text-[13.5px] leading-[1.55] text-muted-foreground">
            Choose a new password to secure your account.
          </p>
        </div>

        {feedback ? (
          <AuthAlert variant={feedback.variant}>
            {feedback.message}
          </AuthAlert>
        ) : null}

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div>
            <PasswordField
              id="reset-new-password"
              label="New password"
              registration={form.register("newPassword")}
            />
            {form.formState.errors.newPassword ? (
              <p className="mt-1.5 text-[12.5px] text-(--danger-fg)">
                {form.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div className="rounded-[12px] bg-(--surface-2) p-3">
            <PasswordRuleChips
              confirmPassword={confirmPassword}
              password={newPassword}
            />
          </div>

          <div>
            <PasswordField
              id="reset-confirm-password"
              label="Confirm password"
              registration={form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="mt-1.5 text-[12.5px] text-(--danger-fg)">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button
            className="h-11 w-full text-[14px] font-semibold"
            disabled={form.formState.isSubmitting}
            shape="xl"
            type="submit"
          >
            {form.formState.isSubmitting ? "Saving..." : "Save new password"}
          </Button>
        </form>

        <div className="text-center">
          <Link
            className="text-[13px] font-semibold text-(--primary-600) no-underline hover:underline"
            to="/login"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthCenteredShell>
  );
}
