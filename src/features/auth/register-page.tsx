import { Mail } from "lucide-react";
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
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { registerSchema, type RegisterFormValues } from "./register.schema";
import { getAuthErrorMessage } from "./auth-utils";
import { getPasswordRules } from "./password-rules";
import { PasswordField } from "./password-field";
import { AuthHeroCopy } from "./auth-hero-copy";
import { AuthPageShell } from "./auth-page-shell";
import { AuthStatusCard } from "./auth-status-card";

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

  const errors = form.formState.errors;

  return (
    <AuthPageShell aside={<AuthHeroCopy />}>
      <div className="flex h-full flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:p-10">
        {submittedEmail ? (
          <AuthStatusCard>
            <StatusPanel
              actions={
                <>
                  <Button asChild className="h-11 px-5" shape="xl" variant="outline">
                    <Link to="/login">{t("auth.register.goToSignIn")}</Link>
                  </Button>
                  <Button
                    className="h-11 px-5"
                    disabled={resendStatus === "loading"}
                    onClick={handleResend}
                    shape="xl"
                    type="button"
                  >
                    {resendStatus === "loading" ? t("auth.register.resendSending") : t("auth.register.resend")}
                  </Button>
                </>
              }
              description={
                <Trans
                  components={{ strong: <strong className="font-semibold text-foreground" /> }}
                  i18nKey="auth.register.checkEmailBody"
                  values={{ email: submittedEmail }}
                />
              }
              icon={Mail}
              note={t("auth.register.resendLimit")}
              title={t("auth.register.checkEmailTitle")}
              tone="success"
            >
              {deliveryFailed ? (
                <div className="w-full text-left">
                  <InlineBanner tone="warning">{t("auth.register.deliveryFailed")}</InlineBanner>
                </div>
              ) : null}
              {resendMessage ? (
                <div className="w-full text-left">
                  <InlineBanner tone={resendStatus === "success" ? "success" : "error"}>{resendMessage}</InlineBanner>
                </div>
              ) : null}
            </StatusPanel>
          </AuthStatusCard>
        ) : (
          <div className="flex w-full max-w-[440px] flex-col gap-[22px]">
            <div className="flex flex-col gap-2">
              <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[30px] font-semibold tracking-[-0.01em] text-foreground">
                {t("auth.register.title")}
              </h1>
              <p className="m-0 text-[14.5px] leading-[1.55] text-muted-foreground">{t("auth.register.subtitle")}</p>
            </div>

            <form className="flex flex-col gap-[22px]" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4">
                <FormField
                  error={errors.fullName?.message}
                  hint={t("auth.register.fullNameHint")}
                  htmlFor="register-full-name"
                  label={t("auth.register.fullName")}
                  required
                >
                  <Input
                    aria-invalid={Boolean(errors.fullName)}
                    id="register-full-name"
                    placeholder={t("auth.register.fullNamePlaceholder")}
                    type="text"
                    {...form.register("fullName")}
                  />
                </FormField>

                <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2">
                  <FormField
                    error={errors.username?.message}
                    htmlFor="register-username"
                    label={t("auth.register.username")}
                    required
                  >
                    <Input
                      aria-invalid={Boolean(errors.username)}
                      id="register-username"
                      placeholder={t("auth.register.usernamePlaceholder")}
                      type="text"
                      {...form.register("username")}
                    />
                  </FormField>

                  <FormField
                    error={errors.mobile?.message}
                    hint={t("auth.register.mobileHint")}
                    htmlFor="register-mobile"
                    label={t("auth.register.mobile")}
                  >
                    <Input
                      aria-invalid={Boolean(errors.mobile)}
                      id="register-mobile"
                      placeholder={t("auth.register.mobilePlaceholder")}
                      type="tel"
                      {...form.register("mobile")}
                    />
                  </FormField>
                </div>

                <FormField
                  error={errors.email?.message}
                  htmlFor="register-email"
                  label={t("auth.register.email")}
                  required
                >
                  <Input
                    aria-invalid={Boolean(errors.email)}
                    id="register-email"
                    placeholder={t("auth.register.emailPlaceholder")}
                    type="email"
                    {...form.register("email")}
                  />
                </FormField>

                <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2">
                  <PasswordField
                    error={errors.password?.message}
                    id="register-password"
                    label={t("auth.register.password")}
                    registration={form.register("password")}
                    required
                  />
                  <PasswordField
                    error={errors.confirmPassword?.message}
                    id="register-confirm-password"
                    label={t("auth.register.confirmPassword")}
                    registration={form.register("confirmPassword")}
                    required
                  />
                </div>

                <p className="-mt-1.5 text-[12.5px] text-muted-foreground">{t("auth.register.passwordHint")}</p>

                <PasswordRules confirmPassword={confirmPassword ?? ""} password={password ?? ""} />

                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2.5 text-[13.5px] leading-normal text-(--status-neutral-fg)">
                    <input
                      aria-invalid={Boolean(errors.termsAccepted)}
                      className="mt-px size-[18px] shrink-0 accent-brand"
                      id="register-terms"
                      type="checkbox"
                      {...form.register("termsAccepted")}
                    />
                    <label htmlFor="register-terms">
                      <Trans
                        components={{
                          terms: <Link className="text-fg-link hover:underline" to="/terms" />,
                          privacy: <Link className="text-fg-link hover:underline" to="/privacy" />,
                        }}
                        i18nKey="auth.register.terms"
                      />{" "}
                      <span className="text-(--field-error)">*</span>
                    </label>
                  </div>
                  {errors.termsAccepted ? (
                    <p className="text-[12.5px] text-(--danger-fg)" role="alert">
                      {errors.termsAccepted.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {submitError ? <InlineBanner tone="error">{submitError}</InlineBanner> : null}

              <Button
                className="h-12 w-full text-[14.5px] font-semibold"
                disabled={form.formState.isSubmitting}
                shape="xl"
                type="submit"
              >
                {form.formState.isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
              </Button>
            </form>

            <p className="m-0 text-center text-[13.5px] text-muted-foreground">
              {t("auth.register.haveAccount")}{" "}
              <Link
                aria-label={t("auth.register.signInInstead")}
                className="font-semibold text-fg-link hover:underline"
                to="/login"
              >
                {t("auth.register.signIn")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </AuthPageShell>
  );
}
