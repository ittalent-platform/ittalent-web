import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { Link, useSearchParams } from "react-router";
import {
  AlertTriangle,
  CircleCheck,
  CircleX,
  Clock3,
  Info,
  Loader2,
} from "lucide-react";

import { getApiV1AuthVerifyEmail, postApiV1AuthResendVerificationEmail } from "@/api/generated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthStatusCard } from "./auth-status-card";
import {
  emailVerificationPath,
  getEmailVerificationCallbackURL,
} from "./email-verification";
import { getAuthErrorMessage } from "./auth-utils";

type VerificationMode =
  | "registration"
  | "success"
  | "already-verified"
  | "invalid"
  | "expired"
  | "retry-later"
  | "verifying";

function normalizeToken(value: string | null) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function containsAny(source: string, values: string[]) {
  return values.some((value) => source.includes(value));
}

export function resolveVerificationMode(
  searchParams: URLSearchParams,
  isVerifying: boolean,
): VerificationMode {
  if (isVerifying) {
    return "verifying";
  }

  const errorSource = [
    searchParams.get("error"),
    searchParams.get("code"),
    searchParams.get("reason"),
    searchParams.get("message"),
    searchParams.get("status"),
  ]
    .map(normalizeToken)
    .join(" ");

  if (
    containsAny(errorSource, [
      "expired",
      "linkexpired",
      "tokenexpired",
      "verificationexpired",
    ])
  ) {
    return "expired";
  }

  if (containsAny(errorSource, ["alreadyverified", "emailalreadyverified"])) {
    return "already-verified";
  }

  if (
    containsAny(errorSource, [
      "ratelimited",
      "toomanyrequests",
      "toomanyattempts",
      "retrylater",
      "abuse",
    ])
  ) {
    return "retry-later";
  }

  if (
    containsAny(errorSource, [
      "invalidtoken",
      "invalidverification",
      "invalidverificationtoken",
      "invalidverificationlink",
    ]) ||
    (errorSource.includes("invalid") && errorSource.length > 0)
  ) {
    return "invalid";
  }

  const stage = normalizeToken(
    searchParams.get("stage") ??
      searchParams.get("mode") ??
      searchParams.get("state"),
  );

  if (
    containsAny(stage, [
      "registration",
      "register",
      "registered",
      "signup",
      "verificationsent",
    ])
  ) {
    return "registration";
  }

  if (containsAny(stage, ["alreadyverified", "verifiedearlier"])) {
    return "already-verified";
  }

  if (containsAny(stage, ["expired", "linkexpired"])) {
    return "expired";
  }

  if (containsAny(stage, ["ratelimited", "retrylater", "abuse"])) {
    return "retry-later";
  }

  if (containsAny(stage, ["invalid", "invalidtoken"])) {
    return "invalid";
  }

  return "success";
}

function getModeCopy(mode: VerificationMode) {
  switch (mode) {
    case "verifying":
      return {
        badgeClassName: "bg-(--surface-4) text-foreground",
        icon: <Loader2 className="size-7 animate-spin" strokeWidth={2.1} />,
        title: "Verifying your email",
        body: "Please wait while we verify your email address...",
        note: null,
      };
    case "registration":
      return {
        badgeClassName: "bg-(--status-success-bg) text-(--status-success-fg)",
        icon: <CircleCheck className="size-7" strokeWidth={2.1} />,
        title: "Registration successful",
        body: "Please check your email to verify your account. The verification link is single-use and expires in 24 hours.",
        note: "Resend is limited to 3 times per 24 hours.",
      };
    case "already-verified":
      return {
        badgeClassName: "bg-(--status-info-bg) text-(--status-info-fg)",
        icon: <Info className="size-7" strokeWidth={2.1} />,
        title: "Already verified",
        body: "No further action is needed — your email was verified earlier and your account remains active.",
        note: null,
      };
    case "invalid":
      return {
        badgeClassName: "bg-(--status-error-bg) text-(--status-error-fg)",
        icon: <CircleX className="size-7" strokeWidth={2.1} />,
        title: "Invalid verification link",
        body: "This email verification link is not valid. Check that you opened the most recent email.",
        note: "Repeated invalid attempts are temporarily blocked (5 per 10 min).",
      };
    case "expired":
      return {
        badgeClassName: "bg-(--status-warning-bg) text-(--status-warning-fg)",
        icon: <Clock3 className="size-7" strokeWidth={2.1} />,
        title: "Link expired",
        body: "The 24-hour verification window has passed. Your account is now blocked-unverified.",
        note: "Resend limited to 3 per 24 hours.",
      };
    case "retry-later":
      return {
        badgeClassName: "bg-(--status-warning-bg) text-(--status-warning-fg)",
        icon: <AlertTriangle className="size-7" strokeWidth={2.1} />,
        title: "Please try again later",
        body: "Too many verification attempts were made in a short period. Please wait before retrying.",
        note: "Repeated invalid attempts are temporarily blocked (5 per 10 min).",
      };
    case "success":
    default:
      return {
        badgeClassName: "bg-(--status-success-bg) text-(--status-success-fg)",
        icon: <CircleCheck className="size-7" strokeWidth={2.1} />,
        title: "Email verified",
        body: "Your account is now active. You can sign in and start exploring.",
        note: null,
      };
  }
}

export function EmailVerificationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim();
  const hasStage = Boolean(
    searchParams.get("stage") ||
      searchParams.get("error") ||
      searchParams.get("code") ||
      searchParams.get("mode"),
  );
  const [isVerifying, setIsVerifying] = useState(Boolean(token && !hasStage));

  const mode = useMemo(
    () => resolveVerificationMode(searchParams, isVerifying),
    [searchParams, isVerifying],
  );
  const deliveryFailed = searchParams.get("delivery") === "failed";
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const [email, setEmail] = useState(emailFromQuery);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || hasStage) return;

    let alive = true;

    getApiV1AuthVerifyEmail({ query: { token } })
      .then((result) => {
        if (!alive) return;
        if (result.response?.url) {
          const redirectedUrl = new URL(result.response.url);
          const stage = redirectedUrl.searchParams.get("stage");
          const code = redirectedUrl.searchParams.get("code");
          if (stage) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("stage", stage);
            if (code) nextParams.set("code", code);
            nextParams.delete("token");
            setSearchParams(nextParams, { replace: true });
            return;
          }
        }
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("stage", "success");
        nextParams.delete("token");
        setSearchParams(nextParams, { replace: true });
      })
      .catch(() => {
        if (!alive) return;
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("stage", "invalid");
        nextParams.delete("token");
        setSearchParams(nextParams, { replace: true });
      })
      .finally(() => {
        if (alive) setIsVerifying(false);
      });

    return () => {
      alive = false;
    };
  }, [token, hasStage, searchParams, setSearchParams]);

  const copy = getModeCopy(mode);
  const canResend = mode === "registration" || mode === "expired";
  const lockedEmail = mode === "registration" && emailFromQuery.length > 0;
  const buttonText =
    resendStatus === "loading" ? "Sending..." : "Resend verification email";

  async function handleResend(
    event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();

    const targetEmail = (lockedEmail ? emailFromQuery : email).trim();
    if (!targetEmail) {
      setResendStatus("error");
      setResendMessage(
        "Enter the email address that should receive the verification link.",
      );
      return;
    }

    setResendStatus("loading");
    setResendMessage(null);

    let response;
    try {
      response = await postApiV1AuthResendVerificationEmail({
        body: {
          email: targetEmail,
        },
      });
    } catch (error) {
      setResendStatus("error");
      setResendMessage(
        getAuthErrorMessage(
          error,
          "We could not send the verification email. Please try again later.",
        ),
      );
      return;
    }

    if (response.error) {
      const message = getAuthErrorMessage(
        response.error,
        "We could not send the verification email. Please try again later.",
      );
      setResendStatus("error");
      setResendMessage(message);
      return;
    }

    setResendStatus("success");
    setResendMessage(response.data?.message ?? "Verification email sent. Please check your inbox.");
  }

  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
      <AuthStatusCard className="overflow-hidden rounded-[0.8rem] bg-white p-0">
        <div className="flex flex-col items-center px-5 py-11 text-center sm:px-10 sm:py-12">
          <div
            className={`grid size-[60px] place-items-center rounded-full text-[26px] ${copy.badgeClassName}`}
          >
            {copy.icon}
          </div>

          <h1 className="mt-4 font-['Space_Grotesk',sans-serif] text-[26px] font-semibold text-foreground sm:text-[30px]">
            {copy.title}
          </h1>

          <p className="mt-3 max-w-[380px] text-[14.5px] leading-[1.6] text-muted-foreground sm:text-[15px]">
            {copy.body}
          </p>

          {mode === "registration" && emailFromQuery ? (
            <div className="mt-4 rounded-[0.5rem] bg-(--surface-4) px-4 py-2 text-[13px] text-muted-foreground">
              Sent to <strong className="text-foreground">{emailFromQuery}</strong>
            </div>
          ) : null}

          {copy.note ? (
            <p className="mt-3 max-w-[380px] text-[12px] leading-[1.55] text-(--fg-faint)">
              {copy.note}
            </p>
          ) : null}

          {deliveryFailed ? (
            <p className="mt-3 max-w-[380px] text-[13px] leading-[1.55] text-(--danger-fg)">
              We could not send the verification email. Please request a new
              verification email.
            </p>
          ) : null}

          {canResend ? (
            lockedEmail ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="flex h-11 items-center justify-center rounded-xl border-0 bg-primary px-6 text-[14.5px] font-semibold text-white no-underline transition hover:bg-primary/85"
                  to="/login"
                >
                  Go to sign in
                </Link>

                <Button
                  className="h-11 px-6 text-[14.5px] font-semibold"
                  disabled={resendStatus === "loading"}
                  onClick={handleResend}
                  type="button"
                  variant="outline"
                >
                  {buttonText}
                </Button>
              </div>
            ) : (
              <form
                className="mt-6 flex w-full max-w-[360px] flex-col gap-3 text-left"
                onSubmit={handleResend}
              >
                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold text-foreground"
                    htmlFor="verification-email"
                  >
                    Email address
                  </label>

                  <Input
                    id="verification-email"
                    className="h-11 w-full rounded-[0.5rem] border border-(--border-muted) bg-white px-3.5 text-sm text-foreground outline-none transition placeholder:text-(--fg-faint) focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <Button
                  className="h-11 px-6 text-[14.5px] font-semibold"
                  disabled={resendStatus === "loading"}
                  type="submit"
                  variant="outline"
                >
                  {buttonText}
                </Button>
              </form>
            )
          ) : null}

          {mode === "success" ? (
            <Link
              className="mt-6 flex h-11 items-center justify-center rounded-xl border-0 bg-primary px-6 text-[14.5px] font-semibold text-white no-underline transition hover:bg-primary/85"
              to="/login"
            >
              Sign in
            </Link>
          ) : null}

          {mode === "already-verified" ? (
            <Link
              className="mt-5 text-[13.5px] font-semibold text-(--primary-600) no-underline hover:underline"
              to="/login"
            >
              Go to sign in →
            </Link>
          ) : null}

          {resendMessage ? (
            <p
              aria-live="polite"
              className={`mt-4 max-w-[380px] text-[13px] leading-[1.55] ${resendStatus === "error" ? "text-(--danger-fg)" : "text-(--status-success-fg)"}`}
            >
              {resendMessage}
            </p>
          ) : null}
        </div>
      </AuthStatusCard>
    </div>
  );
}

export { emailVerificationPath, getEmailVerificationCallbackURL };
