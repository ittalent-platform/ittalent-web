import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { postApiV1AuthRegister } from "@/api/generated";
import { authClient } from "@/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { registerSchema, type RegisterFormValues } from "./register.schema";
import { emailVerificationPath } from "./email-verification";
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
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

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

      const searchParams = new URLSearchParams({
        email: values.email,
        stage: "registration",
      });

      if (!result.data.verificationEmailSent) {
        searchParams.set("delivery", "failed");
      }

      navigate(`${emailVerificationPath}?${searchParams.toString()}`, { replace: true });
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, "Unable to create your account right now."));
    }
  }

  return (
    <AuthPageShell
      aside={
        <>
          <AuthBrand />

          <div className="flex flex-col gap-5">
            <h2 className="m-0 font-['Space_Grotesk',sans-serif] text-4xl font-semibold leading-[1.15]">
              Where IT careers
              <br />
              take shape.
            </h2>

            <p className="m-0 max-w-[340px] text-sm leading-[1.6] text-white/80">
              Apply to IT jobs from verified companies and follow every application in one place.
            </p>
          </div>

          <div className="text-xs text-white/80">
            Hiring?{" "}
            <Link className="font-medium underline hover:text-white" to="/employer">
              Go to ITTalent for employers →
            </Link>
          </div>
        </>
      }
    >
      <div className="flex flex-1 h-full items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:p-12">
        <div className="flex w-full max-w-[460px] flex-col gap-5.5">
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
        </div>
      </div>
    </AuthPageShell>
  );
}
