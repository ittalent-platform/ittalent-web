import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
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
import { AuthAlert } from "./auth-alert";

interface SubmitAlertState {
  variant: "error" | "warning";
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

export function LoginPage() {
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
      const rawMessage = getAuthErrorMessage(error, "Unable to sign in right now.");
      const lower = rawMessage.toLowerCase();

      if (
        lower.includes("invalid credentials") ||
        lower.includes("invalid") ||
        lower.includes("incorrect") ||
        lower.includes("failed")
      ) {
        setSubmitAlert({
          variant: "error",
          message: "Email or password is incorrect.",
        });
      } else if (
        lower.includes("too many") ||
        lower.includes("rate limit") ||
        lower.includes("attempts")
      ) {
        setSubmitAlert({
          variant: "error",
          message: "Too many sign-in attempts. Please try again in 15 minutes.",
        });
      } else if (lower.includes("suspend")) {
        setSubmitAlert({
          variant: "error",
          message: "This account is suspended. Contact ITTalent support if you think this is a mistake.",
        });
      } else if (lower.includes("verify") || lower.includes("verification")) {
        setSubmitAlert({
          variant: "warning",
          message: "Verify your email to continue.",
          action: {
            label: "Resend email",
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
        <div className="flex w-full max-w-[420px] flex-col gap-[22px]">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[30px] font-semibold tracking-[-0.01em] text-foreground">
              Welcome back
            </h1>

            <p className="m-0 text-[14.5px] leading-[1.55] text-muted-foreground">
              Sign in to your ITTalent candidate account.
            </p>
          </div>

          {submitAlert ? (
            <AuthAlert
              variant={submitAlert.variant}
              action={
                submitAlert.action ? (
                  <Link
                    className="font-semibold underline underline-offset-2 hover:opacity-80"
                    to={submitAlert.action.href}
                  >
                    {submitAlert.action.label}
                  </Link>
                ) : null
              }
            >
              {submitAlert.message}
            </AuthAlert>
          ) : reason === "session_expired" ? (
            <AuthAlert variant="warning">
              Your session has expired. Sign in again to continue.
            </AuthAlert>
          ) : reason === "logged_out" ? (
            <AuthAlert variant="info">
              You&apos;ve been signed out.
            </AuthAlert>
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
                Email or Username
              </label>

              <Input
                id="login-identifier"
                className="h-[46px] w-full rounded-[12px] border border-(--border-muted) bg-white px-[15px] text-[14px] text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-2 focus:ring-primary/15"
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
                    className="text-[13px] font-semibold text-(--primary-600) no-underline hover:underline"
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

            <Button
              className="h-12 w-full text-[14.5px] font-semibold"
              disabled={form.formState.isSubmitting}
              shape="xl"
              type="submit"
            >
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-[12.5px] text-(--fg-faint)">
            <div className="h-px flex-1 bg-(--border-faint)" />
            <span>New to ITTalent?</span>
            <div className="h-px flex-1 bg-(--border-faint)" />
          </div>

          <Link
            className="flex h-11 w-full items-center justify-center rounded-[12px] border border-(--border-muted) bg-white text-[14px] font-semibold text-foreground no-underline transition hover:bg-[#f4f3ef]"
            to="/register"
          >
            Create an account
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
