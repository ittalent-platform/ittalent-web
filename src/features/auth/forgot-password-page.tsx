import { useState } from "react";
import { Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { postApiV1AuthForgotPassword } from "@/api/generated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCenteredShell } from "./auth-centered-shell";
import { AuthAlert } from "./auth-alert";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "./forgot-password.schema";
import { getAuthErrorMessage } from "./auth-utils";

interface ForgotAlertState {
  variant: "error" | "warning";
  message: string;
}

export function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [alert, setAlert] = useState<ForgotAlertState | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setAlert(null);

    try {
      const response = await postApiV1AuthForgotPassword({
        body: { email: values.email },
      });

      if (response.error) {
        const status = response.response?.status;
        const msg = getAuthErrorMessage(response.error, "Unable to send reset instructions right now.");
        const lower = msg.toLowerCase();

        if (status === 429 || lower.includes("too many") || lower.includes("rate limit")) {
          setAlert({
            variant: "error",
            message: "Too many reset requests for this email. Try again in 15 minutes.",
          });
        } else if (status === 503 || lower.includes("couldn't send") || lower.includes("service")) {
          setAlert({
            variant: "warning",
            message: "We couldn't send the email right now. Try again later.",
          });
        } else {
          setAlert({
            variant: "error",
            message: msg,
          });
        }
        return;
      }

      setSubmittedEmail(values.email);
    } catch (error) {
      const msg = getAuthErrorMessage(error, "Unable to send reset instructions right now.");
      const lower = msg.toLowerCase();

      if (lower.includes("too many") || lower.includes("rate limit")) {
        setAlert({
          variant: "error",
          message: "Too many reset requests for this email. Try again in 15 minutes.",
        });
      } else {
        setAlert({
          variant: "error",
          message: msg,
        });
      }
    }
  }

  // Confirmation screen: Same confirmation for every email
  if (submittedEmail) {
    return (
      <AuthCenteredShell>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-(--status-success-bg) text-(--status-success-fg)"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z m18 2-10 7L2 6" />
            </svg>
          </span>

          <h1 className="mt-1 font-['Space_Grotesk',sans-serif] text-[20px] font-semibold text-foreground">
            Check your email
          </h1>

          <p className="m-0 max-w-[400px] text-[13.5px] leading-[1.6] text-muted-foreground">
            If an account exists for{" "}
            <strong className="font-semibold text-foreground">{submittedEmail}</strong>
            , we sent reset instructions.
          </p>

          <div className="mt-2 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link
              className="flex h-11 items-center justify-center rounded-[12px] border border-(--border-muted) bg-white px-5 text-[14px] font-semibold text-foreground no-underline transition hover:bg-(--surface-2)"
              to="/login"
            >
              Back to sign in
            </Link>

            <Button
              className="h-11 text-[13.5px] font-semibold text-fg-link hover:text-fg-link"
              onClick={() => {
                setSubmittedEmail(null);
                setAlert(null);
                form.reset();
              }}
              type="button"
              variant="ghost"
            >
              Send another link
            </Button>
          </div>
        </div>
      </AuthCenteredShell>
    );
  }

  // Request Reset Link Form (Card 1)
  return (
    <AuthCenteredShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[20px] font-semibold text-foreground">
            Reset your password
          </h1>
          <p className="m-0 text-[13.5px] leading-[1.55] text-muted-foreground">
            Enter your email. We&apos;ll send a link that works once and expires in 24 hours.
          </p>
        </div>

        {alert ? (
          <AuthAlert variant={alert.variant}>
            {alert.message}
          </AuthAlert>
        ) : null}

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div>
            <label
              className="mb-2 block text-[13.5px] font-semibold text-foreground"
              htmlFor="forgot-password-email"
            >
              Email
            </label>

            <Input
              id="forgot-password-email"
              className="h-[46px] w-full rounded-[12px] border border-(--border-muted) bg-white px-[15px] text-[14px] text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="you@example.com"
              type="email"
              {...form.register("email")}
            />

            {form.formState.errors.email ? (
              <p className="mt-1.5 text-[12.5px] text-(--danger-fg)">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <Button
            className="h-11 w-full text-[14px] font-semibold"
            disabled={form.formState.isSubmitting}
            shape="xl"
            type="submit"
          >
            {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <div className="text-center">
          <Link
            className="text-[13px] font-semibold text-fg-link no-underline hover:underline"
            to="/login"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthCenteredShell>
  );
}
