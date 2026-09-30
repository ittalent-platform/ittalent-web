import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import type { TFunction } from "i18next";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { AlertTriangle, Check, CircleX, Clock3, Info, Loader2, Mail, type LucideIcon } from "lucide-react";

import { getApiV1AuthVerifyEmail, postApiV1AuthResendVerificationEmail } from "@/api/generated";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/common/form-field";
import { StatusPanel, type StatusPanelTone } from "@/components/common/status-panel";
import { Input } from "@/components/ui/input";
import { AuthCardPage, AuthStatusCard } from "./auth-status-card";
import { AUTH_ACTION_CLASS, AUTH_FULL_ACTION_CLASS, VERIFY_NEW_LINK_PATH } from "./auth-status.constants";
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

type ModeCopy = {
  body: string;
  icon: LucideIcon;
  iconClassName?: string;
  note: string | null;
  title: string;
  tone: StatusPanelTone;
};

function getModeCopy(mode: VerificationMode, t: TFunction): ModeCopy {
  switch (mode) {
    case "verifying":
      return { body: t("auth.verify.verifying.body"), icon: Loader2, iconClassName: "animate-spin", note: null, title: t("auth.verify.verifying.title"), tone: "neutral" };
    case "registration":
      return { body: t("auth.verify.registration.body"), icon: Mail, note: t("auth.verify.registration.note"), title: t("auth.verify.registration.title"), tone: "success" };
    case "already-verified":
      return { body: t("auth.verify.alreadyVerified.body"), icon: Info, note: null, title: t("auth.verify.alreadyVerified.title"), tone: "info" };
    case "invalid":
      return { body: t("auth.verify.invalid.body"), icon: CircleX, note: t("auth.verify.invalid.note"), title: t("auth.verify.invalid.title"), tone: "danger" };
    case "expired":
      return { body: t("auth.verify.expired.body"), icon: Clock3, note: t("auth.verify.expired.note"), title: t("auth.verify.expired.title"), tone: "warning" };
    case "retry-later":
      return { body: t("auth.verify.retryLater.body"), icon: AlertTriangle, note: t("auth.verify.invalid.note"), title: t("auth.verify.retryLater.title"), tone: "warning" };
    case "success":
    default:
      return { body: t("auth.verify.success.body"), icon: Check, note: null, title: t("auth.verify.success.title"), tone: "success" };
  }
}

export function EmailVerificationPage() {
  const { t } = useTranslation();
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

  const copy = getModeCopy(mode, t);
  const lockedEmail = mode === "registration" && emailFromQuery.length > 0;
  const buttonText =
    resendStatus === "loading" ? t("auth.verify.sending") : t("auth.verify.resend");

  async function handleResend(
    event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();

    const targetEmail = (lockedEmail ? emailFromQuery : email).trim();
    if (!targetEmail) {
      setResendStatus("error");
      setResendMessage(
        t("auth.verify.emailRequired"),
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
          t("auth.verify.resendError"),
        ),
      );
      return;
    }

    if (response.error) {
      const message = getAuthErrorMessage(
        response.error,
        t("auth.verify.resendError"),
      );
      setResendStatus("error");
      setResendMessage(message);
      return;
    }

    setResendStatus("success");
    setResendMessage(response.data?.message ?? t("auth.verify.resendSuccess"));
  }

  const description =
    mode === "registration" && emailFromQuery ? (
      <Trans
        components={{ strong: <strong className="font-semibold text-foreground" /> }}
        i18nKey="auth.verify.registration.bodyWithEmail"
        values={{ email: emailFromQuery }}
      />
    ) : (
      copy.body
    );
  const resendFeedback = resendMessage ? (
    <p
      aria-live="polite"
      className={`max-w-[400px] text-[13px] leading-[1.55] ${resendStatus === "error" ? "text-(--danger-fg)" : "text-(--status-success-fg)"}`}
    >
      {resendMessage}
    </p>
  ) : null;

  // Expired link, no address known yet: the design's "Resend verification email" form.
  if (mode === "expired" && !lockedEmail) {
    return (
      <AuthCardPage>
        <AuthStatusCard>
          <StatusPanel description={copy.body} icon={copy.icon} note={copy.note} title={copy.title} tone={copy.tone}>
            <form className="mt-2 flex w-full flex-col gap-4 text-left" onSubmit={handleResend}>
              <FormField htmlFor="verification-email" label={t("auth.verify.emailAddress")}>
                <Input
                  id="verification-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("auth.verify.emailPlaceholder")}
                  type="email"
                  value={email}
                />
              </FormField>
              <Button className={AUTH_FULL_ACTION_CLASS} disabled={resendStatus === "loading"} shape="xl" type="submit">
                {resendStatus === "loading" ? t("auth.verify.sending") : t("auth.verify.sendNewLink")}
              </Button>
            </form>
            {resendFeedback}
          </StatusPanel>
        </AuthStatusCard>
      </AuthCardPage>
    );
  }

  const actions =
    mode === "registration" ? (
      <>
        <Button asChild className={AUTH_ACTION_CLASS} shape="xl" variant="outline">
          <Link to="/login">{t("auth.verify.goToSignIn")}</Link>
        </Button>
        <Button className={AUTH_ACTION_CLASS} disabled={resendStatus === "loading"} onClick={handleResend} shape="xl" type="button">
          {buttonText}
        </Button>
      </>
    ) : mode === "success" ? (
      <Button asChild className={AUTH_ACTION_CLASS} shape="xl">
        <Link to="/login">{t("auth.verify.signIn")}</Link>
      </Button>
    ) : mode === "already-verified" ? (
      <Button asChild className={AUTH_ACTION_CLASS} shape="xl" variant="outline">
        <Link to="/login">{t("auth.verify.goToSignIn")}</Link>
      </Button>
    ) : mode === "invalid" ? (
      <Button asChild className={AUTH_ACTION_CLASS} shape="xl" variant="outline">
        <Link to={VERIFY_NEW_LINK_PATH}>{t("auth.verify.requestNewLink")}</Link>
      </Button>
    ) : undefined;

  return (
    <AuthCardPage>
      <AuthStatusCard>
        <StatusPanel
          actions={actions}
          description={description}
          icon={copy.icon}
          iconClassName={copy.iconClassName}
          note={copy.note}
          title={copy.title}
          tone={copy.tone}
        >
          {deliveryFailed ? (
            <p className="max-w-[400px] text-[13px] leading-[1.55] text-(--danger-fg)">{t("auth.verify.deliveryFailed")}</p>
          ) : null}
          {resendFeedback}
        </StatusPanel>
      </AuthStatusCard>
    </AuthCardPage>
  );
}

export { emailVerificationPath, getEmailVerificationCallbackURL };
