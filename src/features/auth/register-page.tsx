import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import {
  postApiV1AuthRegister,
  postApiV1AuthResendVerificationEmail,
} from "@/api/generated";
import { authClient } from "@/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { registerSchema, type RegisterFormValues } from "./register.schema";
import { getAuthErrorMessage } from "./auth-utils";
import { getPasswordRules } from "./password-rules";
import { PasswordField } from "./password-field";
import { AuthHeroCopy } from "./auth-hero-copy";
import { AuthPageShell } from "./auth-page-shell";

function PasswordRules({ password, confirmPassword }: { password: string; confirmPassword: string }) {
  const { t } = useTranslation();
  const touched = password.length > 0 || confirmPassword.length > 0;

  return (
    <div className="flex flex-wrap gap-1.5" aria-live="polite">
      {getPasswordRules(password, confirmPassword).map((rule) => {
        const active = touched && rule.ok;
        const invalid = touched && !rule.ok;

        return (
          <span
            key={rule.id}
            className={[
              "rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-all duration-200",
              active ? "scale-[1.02] bg-(--status-success-bg) text-(--status-success-fg)" : "",
              invalid ? "bg-(--danger-bg) text-(--danger-fg)" : "",
              !touched ? "bg-(--surface-4) text-muted-foreground" : "",
            ].join(" ")}
          >
            {t(`auth.password.rule.${rule.id}`)} {touched ? (rule.ok ? "✓" : "×") : ""}
          </span>
        );
      })}
    </div>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [deliveryFailed, setDeliveryFailed] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
    resolver: zodResolver(registerSchema),
  });

  const password = useWatch({ control: form.control, name: "password" });
  const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" });

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null);

    try {
      const result = await postApiV1AuthRegister({
        body: {
          email: values.email,
          username: values.username,
          password: values.password,
        },
      });

      if (result.error || !result.data) {
        throw result.error ?? new Error("Registration failed");
      }

      authClient.login(result.data.tokens, result.data.user);
      setSubmittedEmail(values.email);
      if (!result.data.verificationEmailSent) {
        setDeliveryFailed(true);
      }
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, t("auth.register.errorFallback")));
    }
  }

  async function handleResend() {
    if (!submittedEmail) return;
    setResendStatus("loading");
    setResendMessage(null);

    try {
      await postApiV1AuthResendVerificationEmail({
        body: { email: submittedEmail },
      });
      setResendStatus("success");
      setDeliveryFailed(false);
      setResendMessage(t("auth.register.resendSuccess"));
    } catch (error) {
      setResendStatus("error");
      setResendMessage(
        getAuthErrorMessage(error, t("auth.register.resendError"))
      );
    }
  }

  return (
    <AuthPageShell
      aside={<AuthHeroCopy />}
    >
      <div className="flex flex-1 h-full items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:p-12">
        <div className="flex w-full max-w-[460px] flex-col gap-5.5">
          {submittedEmail ? (
            <div className="flex flex-col gap-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-(--status-success-bg) text-(--status-success-fg)">
                <svg
                  aria-hidden="true"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect height="16" rx="2" width="20" x="2" y="4" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>

              <div>
                <h1 className="mb-2 font-['Space_Grotesk',sans-serif] text-[26px] font-semibold text-foreground">
                  {t("auth.register.checkEmailTitle")}
                </h1>
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">
                  <Trans
                    components={{ strong: <strong className="font-semibold text-foreground" /> }}
                    i18nKey="auth.register.checkEmailBody"
                    values={{ email: submittedEmail }}
                  />
                </p>
              </div>

              {deliveryFailed ? (
                <div className="rounded-lg bg-(--status-warning-bg) p-3.5 text-xs text-(--status-warning-fg)">
                  {t("auth.register.deliveryFailed")}
                </div>
              ) : null}

              {resendMessage ? (
                <div
                  className={`rounded-lg p-3.5 text-xs ${
                    resendStatus === "success"
                      ? "bg-(--status-success-bg) text-(--status-success-fg)"
                      : "bg-(--danger-bg) text-(--danger-fg)"
                  }`}
                >
                  {resendMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link className="flex-1" to="/login">
                  <Button
                    className="h-11 w-full text-sm font-semibold"
                    shape="xl"
                    type="button"
                    variant="outline"
                  >
                    {t("auth.register.goToSignIn")}
                  </Button>
                </Link>

                <Button
                  className="h-11 flex-1 text-sm font-semibold"
                  disabled={resendStatus === "loading"}
                  onClick={handleResend}
                  shape="xl"
                  type="button"
                >
                  {resendStatus === "loading" ? t("auth.register.resendSending") : t("auth.register.resend")}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground sm:text-left">
                {t("auth.register.resendLimit")}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="mb-1.5 font-['Space_Grotesk',sans-serif] text-[26px] font-semibold text-foreground">
                  {t("auth.register.title")}
                </h1>

                <p className="m-0 text-sm text-muted-foreground">
                  {t("auth.register.subtitle")}
                </p>
              </div>

              <form
                className="flex flex-col gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label
                      className="text-[13px] font-semibold text-foreground"
                      htmlFor="register-full-name"
                    >
                      {t("auth.register.fullName")} <span className="text-primary">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">{t("auth.register.fullNameHint")}</span>
                  </div>

                  <Input
                    id="register-full-name"
                    placeholder={t("auth.register.fullNamePlaceholder")}
                    type="text"
                    {...form.register("fullName")}
                  />

                  {form.formState.errors.fullName ? (
                    <p className="mt-1.5 text-sm text-destructive">
                      {form.formState.errors.fullName.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-1.5 block text-[13px] font-semibold text-foreground"
                      htmlFor="register-username"
                    >
                      {t("auth.register.username")} <span className="text-primary">*</span>
                    </label>

                    <Input
                      id="register-username"
                    placeholder={t("auth.register.usernamePlaceholder")}
                      type="text"
                      {...form.register("username")}
                    />

                    {form.formState.errors.username ? (
                      <p className="mt-1.5 text-sm text-destructive">
                        {form.formState.errors.username.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <label
                        className="text-[13px] font-semibold text-foreground"
                        htmlFor="register-mobile"
                      >
                        {t("auth.register.mobile")}
                      </label>
                      <span className="text-xs text-muted-foreground">{t("auth.register.optional")}</span>
                    </div>

                    <Input
                      id="register-mobile"
                    placeholder={t("auth.register.mobilePlaceholder")}
                      type="tel"
                      {...form.register("mobile")}
                    />

                    {form.formState.errors.mobile ? (
                      <p className="mt-1.5 text-sm text-destructive">
                        {form.formState.errors.mobile.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold text-foreground"
                    htmlFor="register-email"
                  >
                    {t("auth.register.email")} <span className="text-primary">*</span>
                  </label>

                  <Input
                    id="register-email"
                    placeholder={t("auth.register.emailPlaceholder")}
                    type="email"
                    {...form.register("email")}
                  />

                  {form.formState.errors.email ? (
                    <p className="mt-1.5 text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <PasswordField
                      id="register-password"
                      label={t("auth.register.password")}
                      labelExtra={<span className="text-primary">*</span>}
                      registration={form.register("password")}
                    />

                    {form.formState.errors.password ? (
                      <p className="mt-1.5 text-sm text-destructive">
                        {form.formState.errors.password.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <PasswordField
                      id="register-confirm-password"
                      label={t("auth.register.confirmPassword")}
                      labelExtra={<span className="text-primary">*</span>}
                      registration={form.register("confirmPassword")}
                    />

                    {form.formState.errors.confirmPassword ? (
                      <p className="mt-1.5 text-sm text-destructive">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t("auth.register.passwordHint")}
                </p>

                <PasswordRules
                  confirmPassword={confirmPassword ?? ""}
                  password={password ?? ""}
                />

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="register-terms"
                    type="checkbox"
                    className="mt-0.5 size-4 rounded border-gray-300 accent-primary focus:ring-primary"
                    {...form.register("termsAccepted")}
                  />
                  <label htmlFor="register-terms" className="text-xs leading-relaxed text-muted-foreground">
                    <Trans
                      components={{
                        terms: <Link className="font-medium text-primary hover:underline" to="/terms" />,
                        privacy: <Link className="font-medium text-primary hover:underline" to="/privacy" />,
                      }}
                      i18nKey="auth.register.terms"
                    />{" "}
                    <span className="text-primary">*</span>
                  </label>
                </div>
                {form.formState.errors.termsAccepted ? (
                  <p className="-mt-2 text-sm text-destructive">
                    {form.formState.errors.termsAccepted.message}
                  </p>
                ) : null}

                {submitError ? (
                  <p className="text-sm text-destructive">{submitError}</p>
                ) : null}

                <Button
                  className="h-11.5 w-full text-[14.5px] font-semibold"
                  disabled={form.formState.isSubmitting}
                  shape="xl"
                  type="submit"
                >
                  {form.formState.isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {t("auth.register.haveAccount")}{" "}
                <Link
                  aria-label={t("auth.register.signInInstead")}
                  className="font-medium text-primary hover:underline"
                  to="/login"
                >
                  {t("auth.register.signIn")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </AuthPageShell>
  );
}
