import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Check, CircleAlert, Clock3, Loader2 } from "lucide-react";
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
import { InlineBanner } from "@/components/common/inline-banner";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { getPasswordRules } from "./password-rules";
import { PasswordField } from "./password-field";
import { AuthCardPage, AuthFormHeader, AuthStatusCard } from "./auth-status-card";
import { AUTH_ACTION_CLASS, AUTH_FULL_ACTION_CLASS } from "./auth-status.constants";

function getStatusTone(status?: number) {
  if (status === 429) {
    return "warning";
  }

  return "error";
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
    tone: "success" | "warning" | "error";
  } | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: {
      confirmPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

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
      message: t("auth.reset.successTitle"),
      tone: "success",
    });
  }

  const requestNewLink = (
    <Button asChild className={AUTH_ACTION_CLASS} shape="xl" variant="outline">
      <Link to={forgotPasswordPath}>{t("auth.reset.requestNewLinkShort")}</Link>
    </Button>
  );

  if (missingToken || tokenStatus === "expired" || tokenStatus === "invalid") {
    return (
      <AuthCardPage>
        <AuthStatusCard>
          <StatusPanel
            actions={requestNewLink}
            description={t("auth.reset.unusableBody")}
            icon={Clock3}
            title={t("auth.reset.unusableTitle")}
            tone="warning"
          />
        </AuthStatusCard>
      </AuthCardPage>
    );
  }

  if (tokenStatus === "checking") {
    return (
      <AuthCardPage>
        <AuthStatusCard>
          <StatusPanel icon={Loader2} iconClassName="animate-spin" title={t("auth.reset.checking")} tone="neutral" />
        </AuthStatusCard>
      </AuthCardPage>
    );
  }

  if (tokenStatus === "error") {
    return (
      <AuthCardPage>
        <AuthStatusCard>
          <StatusPanel
            actions={
              <Button
                className={AUTH_ACTION_CLASS}
                onClick={() => {
                  setTokenStatus("checking");
                  setPreflightAttempt((attempt) => attempt + 1);
                }}
                shape="xl"
                type="button"
              >
                {t("auth.reset.retry")}
              </Button>
            }
            description={t("auth.reset.checkFailedBody")}
            icon={CircleAlert}
            title={t("auth.reset.checkFailedTitle")}
            tone="danger"
          />
        </AuthStatusCard>
      </AuthCardPage>
    );
  }

  if (feedback?.tone === "success") {
    return (
      <AuthCardPage>
        <AuthStatusCard>
          <StatusPanel
            actions={
              <Button asChild className={AUTH_ACTION_CLASS} shape="xl">
                <Link to="/login">{t("auth.reset.signIn")}</Link>
              </Button>
            }
            description={t("auth.reset.successBody")}
            icon={Check}
            title={t("auth.reset.successTitle")}
            tone="success"
          />
        </AuthStatusCard>
      </AuthCardPage>
    );
  }

  return (
    <AuthCardPage>
      <AuthStatusCard className="flex flex-col gap-4">
        <AuthFormHeader description={t("auth.reset.subtitle")} title={t("auth.reset.title")} />

        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <PasswordField
            error={form.formState.errors.newPassword?.message}
            hint={t("auth.reset.passwordHint")}
            id="reset-new-password"
            label={t("auth.reset.newPassword")}
            registration={form.register("newPassword")}
            required
          />

          <PasswordField
            error={form.formState.errors.confirmPassword?.message}
            id="reset-confirm-password"
            label={t("auth.reset.confirmPassword")}
            registration={form.register("confirmPassword")}
            required
          />

          <PasswordRuleChips confirmPassword={confirmPassword} password={newPassword} />

          {feedback ? (
            <InlineBanner tone={feedback.tone === "warning" ? "warning" : "error"}>{feedback.message}</InlineBanner>
          ) : null}

          <Button className={AUTH_FULL_ACTION_CLASS} disabled={form.formState.isSubmitting} shape="xl" type="submit">
            {form.formState.isSubmitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
          </Button>
        </form>

        <Link className="self-center text-[13.5px] font-semibold text-fg-link no-underline hover:underline" to="/login">
          {t("auth.reset.backToSignInPlain")}
        </Link>
      </AuthStatusCard>
    </AuthCardPage>
  );
}
