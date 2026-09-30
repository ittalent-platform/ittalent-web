import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { postApiV1AuthLogin } from "@/api/generated";
import { authClient } from "@/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { loginSchema, type LoginFormValues } from "./login.schema";
import { forgotPasswordPath } from "./password-reset";
import { getAuthErrorMessage } from "./auth-utils";
import { PasswordField } from "./password-field";
import { AuthBrand } from "./auth-brand";
import { AuthPageShell } from "./auth-page-shell";

export function LoginPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      identifier: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);

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
      setSubmitError(getAuthErrorMessage(error, "Unable to sign in right now."));
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
        <div className="flex w-full max-w-100 flex-col gap-5.5">
          <div>
            <h1 className="mb-1.5 font-['Space_Grotesk',sans-serif] text-[26px] font-semibold text-foreground">
              Welcome back
            </h1>

            <p className="m-0 text-sm text-muted-foreground">
              Sign in to your ITTalent account
            </p>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div>
              <label
                className="mb-1.5 block text-[13px] font-semibold text-foreground"
                htmlFor="login-identifier"
              >
                Email or Username
              </label>

              <Input
                id="login-identifier"
                className="h-11 w-full rounded-[0.5rem] border border-(--border-muted) bg-white px-3.5 text-sm text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="you@example.com or username"
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
                label="Password"
                labelExtra={
                  <Link
                    className="text-[12.5px] font-medium text-(--primary-600) no-underline hover:underline"
                    to={forgotPasswordPath}
                  >
                    Forgot password?
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

            {submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}

            <Button
              className="h-11.5 w-full text-[14.5px] font-semibold"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-(--border-faint)" />
            <span className="text-xs text-(--fg-faint)">
              New to ITTalent?
            </span>
            <div className="h-px flex-1 bg-(--border-faint)" />
          </div>

          <Link
            className="flex h-11 items-center justify-center rounded-full border border-(--border-muted) bg-white text-sm font-semibold text-foreground no-underline transition hover:bg-[#f4f3ef]"
            to="/register"
          >
            Create an account
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
