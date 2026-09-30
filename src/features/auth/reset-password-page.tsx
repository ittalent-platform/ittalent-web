import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { AuthStatusCard } from "./auth-status-card";

function getStatusTone(status?: number) {
  if (status === 429) {
    return "warning";
  }

  return "error";
}

function getStatusClasses(tone: "success" | "warning" | "error") {
  switch (tone) {
    case "success":
      return {
        box: "bg-(--status-success-bg) border-(--status-success-fg)/20",
        icon: "text-(--status-success-fg)",
        message: "text-(--status-success-fg)",
        note: "text-(--fg-faint)",
      };
    case "warning":
      return {
        box: "bg-(--status-warning-bg) border-(--status-warning-fg)/20",
        icon: "text-(--status-warning-fg)",
        message: "text-(--status-warning-fg)",
        note: "text-(--fg-faint)",
      };
    case "error":
    default:
      return {
        box: "bg-(--danger-bg) border-(--danger-fg)/20",
        icon: "text-(--danger-fg)",
        message: "text-(--danger-fg)",
        note: "text-(--fg-faint)",
      };
  }
}

function StatusIcon({ tone }: { tone: "success" | "warning" | "error" }) {
  switch (tone) {
    case "success":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3.5 8.2 6.6 11 12.5 4.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="6.25"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8 4.5V8l2.3 1.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "error":
    default:
      return (
        <span aria-hidden="true" className="text-[15px] font-bold leading-none">
          !
        </span>
      );
  }
}

function PasswordRuleChips({
  confirmPassword,
  password,
}: {
  confirmPassword: string;
  password: string;
}) {
  const { t } = useTranslation();
  const touched = password.length > 0 || confirmPassword.length > 0;

  return (
    <div className="flex flex-wrap gap-2" aria-live="polite">
      {getPasswordRules(password, confirmPassword).map((rule) => {
        const active = touched && rule.ok;
        const invalid = touched && !rule.ok;

        return (
          <span
            key={rule.id}
            className={[
              "rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200",
              active
                ? "bg-(--status-success-bg) text-(--status-success-fg)"
                : invalid
                  ? "bg-(--status-error-bg) text-(--status-error-fg)"
                  : "bg-(--status-neutral-bg) text-(--status-neutral-fg)",
            ].join(" ")}
          >
            {t(`auth.password.rule.${rule.id}`)} {touched ? (rule.ok ? "✓" : "×") : ""}
          </span>
        );
      })}
    </div>
  );
}

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const missingToken = token.length === 0;

  const [tokenStatus, setTokenStatus] = useState<
    "checking" | "valid" | "invalid" | "expired" | "error"
  >("checking");
  const [preflightAttempt, setPreflightAttempt] = useState(0);
  const [feedback, setFeedback] = useState<{
    message: string;
    note?: string;
    tone: "success" | "warning" | "error";
  } | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: {
      confirmPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const classes = feedback ? getStatusClasses(feedback.tone) : null;
  const newPassword = useWatch({ control: form.control, name: "newPassword" });
  const confirmPassword = useWatch({
    control: form.control,
    name: "confirmPassword",
  });

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

      setFeedback({
        message: getAuthErrorMessage(
          response.error,
          t("auth.reset.errorFallback"),
        ),
        tone: getStatusTone(status),
      });
      return;
    }

    setFeedback({
      message: response.data?.message ?? t("auth.reset.success"),
      note: t("auth.reset.successNote"),
      tone: "success",
    });
  }

  if (missingToken) {
    return (
      <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
        <div className="w-full max-w-[420px] rounded-[0.8rem] border border-black/15 bg-(--app-canvas) p-9 text-center shadow-[0_24px_80px_rgba(25,25,28,0.12),0_8px_24px_rgba(25,25,28,0.08)]">
          <div className="mx-auto flex size-11 items-center justify-center rounded-[10px] bg-(--danger-bg) text-(--danger-fg)">
            <span
              className="text-[15px] font-bold leading-none"
              aria-hidden="true"
            >
              !
            </span>
          </div>

          <h1 className="mt-4 font-['Space_Grotesk',sans-serif] text-[22px] font-semibold text-foreground">
            {t("auth.reset.invalidTitle")}
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-[1.55] text-muted-foreground">
            {t("auth.reset.missingBody")}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="flex h-11 items-center justify-center rounded-xl border-0 bg-primary px-6 text-[14.5px] font-semibold text-white no-underline transition hover:bg-primary/85"
              to={forgotPasswordPath}
            >
              {t("auth.reset.requestNewLinkShort")}
            </Link>

            <Link
              className="flex h-11 items-center justify-center rounded-xl border border-(--border-muted) bg-white px-6 text-[14.5px] font-semibold text-foreground no-underline transition hover:bg-(--surface-3)"
              to="/login"
            >
              {t("auth.reset.backToSignInPlain")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (tokenStatus === "checking") {
    return (
      <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
        <div className="w-full max-w-[420px] rounded-[0.8rem] border border-black/15 bg-(--app-canvas) p-9 text-center shadow-[0_24px_80px_rgba(25,25,28,0.12),0_8px_24px_rgba(25,25,28,0.08)]">
          <div className="mx-auto size-10 animate-pulse rounded-full bg-(--status-peach-bg)" />
          <p className="mt-4 text-[14px] font-semibold text-muted-foreground">
            {t("auth.reset.checking")}
          </p>
        </div>
      </div>
    );
  }

  if (tokenStatus === "expired") {
    return (
      <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
        <div className="w-full max-w-[420px] rounded-[0.8rem] border border-black/15 bg-(--app-canvas) p-9 text-center shadow-[0_24px_80px_rgba(25,25,28,0.12),0_8px_24px_rgba(25,25,28,0.08)]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-(--status-warning-bg) text-(--status-warning-fg)">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="8.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 7.5V12l3.2 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mt-6 font-['Space_Grotesk',sans-serif] text-[27px] font-semibold text-foreground">
            {t("auth.reset.expiredTitle")}
          </h1>
          <p className="mt-3 text-[15px] leading-[1.6] text-muted-foreground">
            {t("auth.reset.expiredBody")}
          </p>

          <Link
            className="mt-7 flex h-12 items-center justify-center rounded-full border-0 bg-primary text-[16px] font-bold text-white no-underline transition hover:bg-primary/85"
            to={forgotPasswordPath}
          >
            {t("auth.reset.requestNewLink")}
          </Link>
        </div>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
        <div className="w-full max-w-[420px] rounded-[0.8rem] border border-black/15 bg-(--app-canvas) p-9 text-center shadow-[0_24px_80px_rgba(25,25,28,0.12),0_8px_24px_rgba(25,25,28,0.08)]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-(--danger-bg) text-(--danger-fg)">
            <span
              className="text-[28px] font-bold leading-none"
              aria-hidden="true"
            >
              !
            </span>
          </div>
          <h1 className="mt-6 font-['Space_Grotesk',sans-serif] text-[27px] font-semibold text-foreground">
            {t("auth.reset.invalidTitle")}
          </h1>
          <p className="mt-3 text-[15px] leading-[1.6] text-muted-foreground">
            {t("auth.reset.invalidBody")}
          </p>
          <Link
            className="mt-7 flex h-12 items-center justify-center rounded-full border-0 bg-primary text-[16px] font-bold text-white no-underline transition hover:bg-primary/85"
            to={forgotPasswordPath}
          >
            {t("auth.reset.requestNewLink")}
          </Link>
        </div>
      </div>
    );
  }

  if (tokenStatus === "error") {
    return (
      <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
        <div className="w-full max-w-[420px] rounded-[0.8rem] border border-black/15 bg-(--app-canvas) p-9 text-center shadow-[0_24px_80px_rgba(25,25,28,0.12),0_8px_24px_rgba(25,25,28,0.08)]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-(--danger-bg) text-(--danger-fg)">
            <span
              className="text-[28px] font-bold leading-none"
              aria-hidden="true"
            >
              !
            </span>
          </div>

          <h1 className="mt-6 font-['Space_Grotesk',sans-serif] text-[27px] font-semibold text-foreground">
            {t("auth.reset.checkFailedTitle")}
          </h1>
          <p className="mt-3 text-[15px] leading-[1.6] text-muted-foreground">
            {t("auth.reset.checkFailedBody")}
          </p>

          <Button
            className="mt-7 h-12 w-full text-[16px] font-bold"
            shape="pill"
            type="button"
            onClick={() => {
              setTokenStatus("checking");
              setPreflightAttempt((attempt) => attempt + 1);
            }}
          >
            {t("auth.reset.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
      <AuthStatusCard>
        <div className="flex size-[52px] items-center justify-center rounded-[14px] bg-(--status-peach-bg) text-(--status-peach-fg)">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="16"
              r="4.25"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M11.5 12.5 20 4M16 8l3 3M13.5 10.5l2 2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="mt-4">
          <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[27px] font-semibold text-foreground">
            {t("auth.reset.title")}
          </h1>
          <p className="mt-2 text-[15px] leading-[1.6] text-muted-foreground">
            {t("auth.reset.subtitle")}
          </p>
        </div>

        {feedback?.tone === "success" ? (
          <div className="mt-5">
            {classes ? (
              <div
                aria-live="polite"
                className={`flex gap-2.5 rounded-xl border px-3.5 py-3 ${classes.box}`}
              >
                <span className={`${classes.icon} mt-0.5 shrink-0`}>
                  <StatusIcon tone={feedback.tone} />
                </span>
                <div>
                  <p
                    className={`m-0 text-[13px] leading-[1.5] ${classes.message}`}
                  >
                    {feedback.message}
                  </p>
                  {feedback.note ? (
                    <p
                      className={`mt-1.5 text-[11.5px] leading-[1.45] ${classes.note}`}
                    >
                      {feedback.note}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <Link
              className="mt-5 flex h-12 items-center justify-center rounded-full border-0 bg-primary text-[16px] font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-primary/85 hover:shadow-[0_14px_28px_rgba(242,71,12,0.24)]"
              to="/login"
            >
              {t("auth.reset.signIn")}
            </Link>
          </div>
        ) : (
          <>
            <form
              className="mt-6 flex flex-col gap-5"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="grid grid-cols-1 gap-5">
                <PasswordField
                  error={form.formState.errors.newPassword?.message}
                  id="reset-new-password"
                  label={t("auth.reset.newPassword")}
                  registration={form.register("newPassword")}
                />

                <PasswordField
                  error={form.formState.errors.confirmPassword?.message}
                  id="reset-confirm-password"
                  label={t("auth.reset.confirmPassword")}
                  registration={form.register("confirmPassword")}
                />
              </div>

              <PasswordRuleChips
                confirmPassword={confirmPassword}
                password={newPassword}
              />

              <Button
                className="h-12 w-full text-[15px] font-bold"
                disabled={form.formState.isSubmitting}
                shape="pill"
                type="submit"
              >
                {form.formState.isSubmitting
                  ? t("auth.reset.submitting")
                  : t("auth.reset.submit")}
              </Button>
            </form>

            {feedback && classes ? (
              <div
                aria-live="polite"
                className={`mt-4 flex gap-2.5 rounded-xl border px-3.5 py-3 ${classes.box}`}
              >
                <span className={`${classes.icon} mt-0.5 shrink-0`}>
                  <StatusIcon tone={feedback.tone} />
                </span>
                <div>
                  <p
                    className={`m-0 text-[13px] leading-[1.5] ${classes.message}`}
                  >
                    {feedback.message}
                  </p>
                  {feedback.note ? (
                    <p
                      className={`mt-1.5 text-[11.5px] leading-[1.45] ${classes.note}`}
                    >
                      {feedback.note}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          <Link
            className="no-underline transition hover:text-foreground"
            to="/login"
          >
            {t("auth.reset.backToSignIn")}
          </Link>
        </div>
      </AuthStatusCard>
    </div>
  );
}
