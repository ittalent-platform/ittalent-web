import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { postApiV1AuthRegister } from "@/api/generated";
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
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
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

      if (result.data.user.role === "admin") {
        navigate("/admin/users", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
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
              Build your future
              <br />
              with ITTalent.
            </h2>

            <p className="m-0 max-w-[320px] text-sm leading-[1.6] text-white/60">
              Create an account to join the leading tech talent platform and connect
              with top-tier opportunities.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-white/45">
            <span>Fast Onboarding</span>
            <span>·</span>
            <span>Stateless Security</span>
            <span>·</span>
            <span>Developer Driven</span>
          </div>
        </>
      }
    >
      <div className="flex flex-1 h-full items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:p-12">
        <div className="flex w-full max-w-100 flex-col gap-5.5">
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
              <label
                className="mb-1.5 block text-[13px] font-semibold text-foreground"
                htmlFor="register-email"
              >
                Email
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

            <div>
              <label
                className="mb-1.5 block text-[13px] font-semibold text-foreground"
                htmlFor="register-username"
              >
                Username
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
              <PasswordField
                id="register-password"
                label="Password"
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
                registration={form.register("confirmPassword")}
              />

              {form.formState.errors.confirmPassword ? (
                <p className="mt-1.5 text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <PasswordRules
              confirmPassword={confirmPassword ?? ""}
              password={password ?? ""}
            />

            {submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}

            <Button
              className="h-11.5 w-full text-[14.5px] font-semibold"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-(--border-faint)" />
            <span className="text-xs text-(--fg-faint)">
              Already have an account?
            </span>
            <div className="h-px flex-1 bg-(--border-faint)" />
          </div>

          <Link
            className="flex h-11 items-center justify-center rounded-full border border-(--border-muted) bg-white text-sm font-semibold text-foreground no-underline transition hover:bg-[#f4f3ef]"
            to="/login"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
