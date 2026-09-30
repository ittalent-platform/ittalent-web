import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { postApiV1AuthLogin } from "@/api/generated";
import { authClient } from "@/auth/auth-client";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { loginSchema, type LoginFormValues } from "./login.schema";
import { forgotPasswordPath } from "./password-reset";
import { getAuthErrorMessage } from "./auth-utils";
import { PasswordField } from "./password-field";
import { AuthHeroCopy } from "./auth-hero-copy";
import { AuthPageShell } from "./auth-page-shell";

interface SubmitAlertState {
  variant: "error" | "warning";
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");
  const [submitAlert, setSubmitAlert] = useState<SubmitAlertState | null>(null);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      identifier: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitAlert(null);

    try {
      const result = await postApiV1AuthLogin({ body: values });

      if (result.error || !result.data) {
        throw result.error ?? new Error("Login failed");
      }

      authClient.login(result.data.tokens, result.data.user);

      if (result.data.user.role === "admin") {
        navigate("/admin/users", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      const rawMessage = getAuthErrorMessage(error, t("auth.login.errorFallback"));
      const lower = rawMessage.toLowerCase();

      if (
        lower.includes("invalid credentials") ||
        lower.includes("invalid") ||
        lower.includes("incorrect") ||
        lower.includes("failed")
      ) {
        setSubmitAlert({
          variant: "error",
          message: t("auth.login.invalidCredentials"),
        });
      } else if (
        lower.includes("too many") ||
        lower.includes("rate limit") ||
        lower.includes("attempts")
      ) {
        setSubmitAlert({
          variant: "error",
          message: t("auth.login.tooManyAttempts"),
        });
      } else if (lower.includes("suspend")) {
        setSubmitAlert({
          variant: "error",
          message: t("auth.login.suspended"),
        });
      } else if (lower.includes("verify") || lower.includes("verification")) {
        setSubmitAlert({
          variant: "warning",
          message: t("auth.login.verifyEmail"),
          action: {
            label: t("auth.login.resendEmail"),
            href: "/verify-email",
          },
        });
      } else {
        setSubmitAlert({
          variant: "error",
          message: rawMessage,
        });
      }
    }
  }

  return (
    <AuthPageShell
      aside={<AuthHeroCopy />}
    >
      <div className="flex flex-1 h-full items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:p-12">
        <div className="flex w-full max-w-[420px] flex-col gap-[22px]">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[30px] font-semibold tracking-[-0.01em] text-foreground">
              {t("auth.login.title")}
            </h1>

            <p className="m-0 text-[14.5px] leading-[1.55] text-muted-foreground">
              {t("auth.login.subtitle")}
            </p>
          </div>

          {submitAlert ? (
            <InlineBanner
              action={
                submitAlert.action
                  ? { label: submitAlert.action.label, href: submitAlert.action.href }
                  : undefined
              }
              tone={submitAlert.variant}
            >
              {submitAlert.message}
            </InlineBanner>
          ) : reason === "session_expired" ? (
            <InlineBanner tone="warning">
              {t("auth.login.sessionExpired")}
            </InlineBanner>
          ) : reason === "logged_out" ? (
            <InlineBanner tone="info">
              {t("auth.login.loggedOut")}
            </InlineBanner>
          ) : null}

          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div>
              <label
                className="mb-2 block text-[13.5px] font-semibold text-foreground"
                htmlFor="login-identifier"
              >
                {t("auth.login.identifierLabel")}
              </label>

              <Input
                id="login-identifier"
                placeholder={t("auth.login.identifierPlaceholder")}
                type="text"
                {...form.register("identifier")}
              />

              {form.formState.errors.identifier ? (
                <p className="mt-1.5 text-sm text-destructive">
                  {form.formState.errors.identifier.message}
                </p>
              ) : null}
            </div>

            <div>
              <PasswordField
                id="login-password"
                label={t("auth.login.passwordLabel")}
                labelExtra={
                  <Link
                    className="text-[13px] font-semibold text-(--primary-600) no-underline hover:underline"
                    to={forgotPasswordPath}
                  >
                    {t("auth.login.forgotPassword")}
                  </Link>
                }
                registration={form.register("password")}
              />

              {form.formState.errors.password ? (
                <p className="mt-1.5 text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <Button
              className="h-12 w-full text-[14.5px] font-semibold"
              disabled={form.formState.isSubmitting}
              shape="xl"
              type="submit"
            >
              {form.formState.isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-[12.5px] text-(--fg-faint)">
            <div className="h-px flex-1 bg-(--border-faint)" />
            <span>{t("auth.login.newHere")}</span>
            <div className="h-px flex-1 bg-(--border-faint)" />
          </div>

          <Button asChild className="h-11 w-full" variant="outline">
            <Link to="/register">{t("auth.login.createAccount")}</Link>
          </Button>
        </div>
      </div>
    </AuthPageShell>
  );
}
