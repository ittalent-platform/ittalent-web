import { useState } from "react";
import { Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
        box: "bg-(--status-success-bg) border-[#bce0cc]",
        icon: "text-(--status-success-fg)",
        message: "text-[#0e5c3a]",
        note: "text-(--fg-faint)",
      };
    case "warning":
      return {
        box: "bg-(--status-warning-bg) border-[#f0d9ad]",
        icon: "text-[#b43709]",
        message: "text-[#8a4b06]",
        note: "text-(--fg-faint)",
      };
    case "error":
    default:
      return {
        box: "bg-(--danger-bg) border-[#efc3bd]",
        icon: "text-(--danger-fg)",
        message: "text-(--danger-fg)",
        note: "text-(--fg-faint)",
      };
  }
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  switch (tone) {
    case "success":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3.5 8.2 6.6 11 12.5 4.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="6.25"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8 4.5V8l2.3 1.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "error":
    default:
      return (
        <span aria-hidden="true" className="text-[15px] font-bold leading-none">
          !
        </span>
      );
  }
}

function ToastCard({ toast }: { toast: ToastState }) {
  const styles = getToastStyles(toast.tone);

  return (
    <div
      className={`flex gap-2.5 rounded-[0.5rem] border px-3.5 py-3 ${styles.box}`}
      aria-live="polite"
      role="status"
    >
      <span className={`${styles.icon} mt-0.5 shrink-0`}>
        <ToastIcon tone={toast.tone} />
      </span>

      <div>
        <p className={`m-0 text-[13px] leading-[1.5] ${styles.message}`}>
          {toast.message}
        </p>
        {toast.note ? (
          <p className={`mt-1.5 text-[11.5px] leading-[1.45] ${styles.note}`}>
            {toast.note}
          </p>
        ) : null}
      </div>
    </div>
  );
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
      const tone = getToastTone(status);
      setToast(
        getToastCopy(
          tone,
          status,
          getAuthErrorMessage(
            response.error,
            "Unable to send reset instructions right now.",
          ),
        ),
      );
      return;
    }

    setToast(
      getToastCopy(
        "success",
        response.response?.status,
        response.data?.message ??
          "If an account exists for this email, reset instructions have been sent. Check your inbox.",
      ),
    );
    form.reset({ email: values.email });
  }

  function onInvalid() {
    setToast(null);
  }

  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
      <AuthStatusCard>
        <div className="flex size-[58px] items-center justify-center rounded-[14px] bg-(--status-peach-bg) text-(--status-peach-fg)">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="16"
              r="4.25"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M11.5 12.5 20 4M16 8l3 3M13.5 10.5l2 2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="mt-4">
          <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[28px] font-semibold text-foreground">
            Reset your password
          </h1>
          <p className="mt-2 text-[16px] leading-[1.6] text-muted-foreground">
            Enter your registered email and we'll send reset instructions. The
            link expires in 24 hours and can be used once.
          </p>
        </div>

        {toast ? (
          <div className="mt-5">
            <ToastCard toast={toast} />
          </div>
        ) : null}

        <form
          className="mt-7 flex flex-col gap-5"
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        >
          <div>
            <label
              className="mb-2 block text-[15px] font-semibold text-foreground"
              htmlFor="forgot-password-email"
            >
              Email
            </label>

            <Input
              id="forgot-password-email"
              className="h-12 w-full rounded-[1rem] border border-(--border-muted) bg-white px-5 text-[16px] text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-4 focus:ring-primary/15"
              placeholder="you@example.com"
              type="email"
              {...form.register("email")}
            />

            {form.formState.errors.email ? (
              <p className="mt-1.5 text-sm text-red-600">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <Button
            className="h-12 w-full text-[16px] font-bold"
            disabled={form.formState.isSubmitting}
            shape="pill"
            type="submit"
          >
            {form.formState.isSubmitting
              ? "Sending..."
              : "Send reset instructions"}
          </Button>
        </form>

        <Link
          className="mt-7 block text-center text-[15px] text-muted-foreground no-underline hover:text-foreground"
          to="/login"
        >
          ← Back to sign in
        </Link>
      </AuthStatusCard>
    </div>
  );
}
