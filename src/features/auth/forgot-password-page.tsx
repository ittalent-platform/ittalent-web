import { useState } from "react";
import { Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertTriangle, CircleCheck, CircleX, Clock3 } from "lucide-react";

import { postApiV1AuthForgotPassword } from "@/api/generated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthStatusCard } from "./auth-status-card";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "./forgot-password.schema";
import { getAuthErrorMessage } from "./auth-utils";

type ToastTone = "success" | "warning" | "error";

type ToastState = {
  message: string;
  note?: string;
  tone: ToastTone;
};

function getToastTone(status?: number): ToastTone {
  if (status === 429 || status === 503) {
    return "warning";
  }

  return "error";
}

function getToastCopy(
  tone: ToastTone,
  status?: number,
  fallbackMessage?: string,
): ToastState {
  if (tone === "success") {
    return {
      message:
        fallbackMessage ??
        "If an account exists for this email, reset instructions have been sent. Check your inbox.",
      tone,
    };
  }

  if (status === 429) {
    return {
      message:
        fallbackMessage ??
        "Too many reset requests for this email. Please try again later.",
      tone,
    };
  }

  if (status === 503) {
    return {
      message:
        fallbackMessage ??
        "We couldn't send the email right now. Please try again later.",
      tone,
    };
  }

  return {
    message: fallbackMessage ?? "Email must be a valid email address.",
    tone,
  };
}

function getToastStyles(tone: ToastTone) {
  switch (tone) {
    case "success":
      return {
        box: "bg-(--status-success-bg) border-(--status-success-fg)/20",
        icon: "text-(--status-success-fg)",
        message: "text-(--status-success-fg)",
        note: "text-(--fg-faint)",
      };
    case "warning":
      return {
        box: "bg-(--status-warning-bg) border-(--status-warning-fg)/20",
        icon: "text-(--status-warning-fg)",
        message: "text-(--status-warning-fg)",
        note: "text-(--fg-faint)",
      };
    case "error":
    default:
      return {
        box: "bg-(--status-error-bg) border-(--status-error-border)",
        icon: "text-(--status-error-fg)",
        message: "text-(--status-error-fg)",
        note: "text-(--fg-faint)",
      };
  }
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  switch (tone) {
    case "success":
      return <CircleCheck className="size-4 shrink-0" strokeWidth={2} />;
    case "warning":
      return <Clock3 className="size-4 shrink-0" strokeWidth={2} />;
    case "error":
    default:
      return <CircleX className="size-4 shrink-0" strokeWidth={2} />;
  }
}

export function ForgotPasswordPage() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setToast(null);

    const response = await postApiV1AuthForgotPassword({
      body: {
        email: values.email,
      },
    });

    if (response.error) {
      const status = response.response?.status;
      const message = getAuthErrorMessage(
        response.error,
        "Email must be a valid email address.",
      );
      const tone = getToastTone(status);
      setToast(getToastCopy(tone, status, message));
      return;
    }

    setToast(
      getToastCopy(
        "success",
        200,
        response.data?.message ??
          "If an account exists for this email, reset instructions have been sent. Check your inbox.",
      ),
    );
  }

  const toastStyles = toast ? getToastStyles(toast.tone) : null;

  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
      <AuthStatusCard className="overflow-hidden rounded-[0.8rem] bg-white p-0">
        <div className="flex flex-col items-center px-5 py-11 text-center sm:px-10 sm:py-12">
          <div className="grid size-[60px] place-items-center rounded-full bg-(--surface-4) text-[26px] text-foreground">
            <AlertTriangle className="size-7" strokeWidth={2.1} />
          </div>

          <h1 className="mt-4 font-['Space_Grotesk',sans-serif] text-[26px] font-semibold text-foreground sm:text-[30px]">
            Forgot your password?
          </h1>

          <p className="mt-3 max-w-[380px] text-[14.5px] leading-[1.6] text-muted-foreground sm:text-[15px]">
            Enter your registered email address and we will send you instructions
            to reset your password.
          </p>

          <form
            className="mt-6 flex w-full max-w-[360px] flex-col gap-4 text-left"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div>
              <label
                className="mb-1.5 block text-[13px] font-semibold text-foreground"
                htmlFor="forgot-email"
              >
                Email address
              </label>

              <Input
                id="forgot-email"
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

            <Button
              className="h-11 w-full text-[14.5px] font-semibold"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting
                ? "Sending instructions..."
                : "Send reset instructions"}
            </Button>
          </form>

          {toast && toastStyles ? (
            <div
              aria-live="polite"
              className={`mt-6 flex w-full max-w-[360px] items-start gap-2.5 rounded-[0.5rem] border p-3.5 text-left text-[13px] leading-[1.5] ${toastStyles.box}`}
            >
              <div className={`mt-0.5 ${toastStyles.icon}`}>
                <ToastIcon tone={toast.tone} />
              </div>
              <div className="flex-1">
                <p className={`m-0 font-medium ${toastStyles.message}`}>
                  {toast.message}
                </p>
                {toast.note ? (
                  <p className={`mt-1 m-0 text-xs ${toastStyles.note}`}>
                    {toast.note}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <Link
            className="mt-6 text-[13.5px] font-semibold text-primary no-underline hover:underline"
            to="/login"
          >
            ← Back to sign in
          </Link>
        </div>
      </AuthStatusCard>
    </div>
  );
}
