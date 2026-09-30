import { useState } from "react";
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
import { AuthBrand } from "./auth-brand";
import { AuthPageShell } from "./auth-page-shell";

function PasswordRules({ password, confirmPassword }: { password: string; confirmPassword: string }) {
  const touched = password.length > 0 || confirmPassword.length > 0;

  return (
    <div className="flex flex-wrap gap-1.5" aria-live="polite">
      {getPasswordRules(password, confirmPassword).map((rule) => {
        const active = touched && rule.ok;
        const invalid = touched && !rule.ok;

        return (
          <span
            key={rule.label}
            className={[
              "rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-all duration-200",
              active ? "scale-[1.02] bg-[#e6f5ee] text-(--status-success-fg)" : "",
              invalid ? "bg-(--danger-bg) text-(--danger-fg)" : "",
              !touched ? "bg-(--surface-4) text-muted-foreground" : "",
            ].join(" ")}
          >
            {rule.label} {touched ? (rule.ok ? "✓" : "×") : ""}
          </span>
        );
      })}
    </div>
  );
}

export function RegisterPage() {
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
      setSubmitError(getAuthErrorMessage(error, "Unable to create your account right now."));
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
      setResendMessage("A new verification link has been sent to your email.");
    } catch (error) {
      setResendStatus("error");
      setResendMessage(
        getAuthErrorMessage(error, "We could not send the verification email. Please try again later.")
      );
    }
  }

  return (
    <AuthPageShell
      aside={
        <>
          <AuthBrand />

          <div className="mt-22 flex flex-col gap-4.5">
            <h2 className="m-0 font-['Space_Grotesk',sans-serif] text-[46px] font-semibold leading-[1.06] tracking-[-0.015em]">
              Where IT careers
              <br />
              take shape.
            </h2>

            <p className="m-0 max-w-[400px] text-[15.5px] leading-[1.6] text-white/90">
              Apply to IT jobs from verified companies and follow every application in one place.
            </p>

            <div className="mt-1.5 text-sm">
              <Link
                className="font-semibold text-white underline underline-offset-4 decoration-white/50 hover:text-white"
                to="/employer"
              >
                Hiring? Go to ITTalent for employers →
              </Link>
            </div>
          </div>
        </>
      }
    >
      <div className="flex flex-1 h-full items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:p-12">
        <div className="flex w-full max-w-[460px] flex-col gap-5.5">
          {submittedEmail ? (
            <div className="flex flex-col gap-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#e8f5ee] text-[#12764a]">
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
                  Check your email
                </h1>
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">
                  If <strong className="font-semibold text-foreground">{submittedEmail}</strong> can be used, we sent a link to verify it. The link works once and expires in 24 hours.
                </p>
              </div>

              {deliveryFailed ? (
                <div className="rounded-lg bg-[#fff8eb] p-3.5 text-xs text-[#945800]">
                  Your account was created, but we couldn&apos;t send the verification email.
                </div>
              ) : null}

              {resendMessage ? (
                <div
                  className={`rounded-lg p-3.5 text-xs ${
                    resendStatus === "success"
                      ? "bg-[#e8f5ee] text-[#12764a]"
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
                    Go to sign in
                  </Button>
                </Link>

                <Button
                  className="h-11 flex-1 text-sm font-semibold"
                  disabled={resendStatus === "loading"}
                  onClick={handleResend}
                  shape="xl"
                  type="button"
                >
                  {resendStatus === "loading" ? "Sending..." : "Resend email"}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground sm:text-left">
                Resend is limited to 3 times per 24 hours.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="mb-1.5 font-['Space_Grotesk',sans-serif] text-[26px] font-semibold text-foreground">
                  Create an account
                </h1>

                <p className="m-0 text-sm text-muted-foreground">
                  Get started with ITTalent in seconds
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
                      Full name <span className="text-primary">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">2–100 characters</span>
                  </div>

                  <Input
                    id="register-full-name"
                    className="h-11 w-full rounded-[0.5rem] border border-(--border-muted) bg-white px-3.5 text-sm text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder="Nguyen Van A"
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
                      Username <span className="text-primary">*</span>
                    </label>

                    <Input
                      id="register-username"
                      className="h-11 w-full rounded-[0.5rem] border border-(--border-muted) bg-white px-3.5 text-sm text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="e.g. alex_dev"
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
                        Mobile
                      </label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>

                    <Input
                      id="register-mobile"
                      className="h-11 w-full rounded-[0.5rem] border border-(--border-muted) bg-white px-3.5 text-sm text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="0901 234 567"
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
                    Email <span className="text-primary">*</span>
                  </label>

                  <Input
                    id="register-email"
                    className="h-11 w-full rounded-[0.5rem] border border-(--border-muted) bg-white px-3.5 text-sm text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder="you@example.com"
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
                      label="Password"
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
                      label="Confirm password"
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
                  8–64 characters with upper case, lower case, a number and a special character.
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
                    I agree to the{" "}
                    <Link to="/terms" className="font-medium text-primary hover:underline">
                      Terms of use
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="font-medium text-primary hover:underline">
                      Privacy policy
                    </Link>
                    . <span className="text-primary">*</span>
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
                  {form.formState.isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  aria-label="Sign in instead"
                  className="font-medium text-primary hover:underline"
                  to="/login"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </AuthPageShell>
  );
}
