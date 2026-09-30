import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { AlertTriangle, Check, CircleX, Clock3, Info, Loader2, Mail } from "lucide-react";

import { getApiV1AuthVerifyEmail } from "@/api/generated";
import { FormField } from "@/components/common/form-field";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCardPage, AuthStatusCard } from "./auth-status-card";
import { AUTH_ACTION_CLASS, AUTH_FULL_ACTION_CLASS, VERIFY_NEW_LINK_PATH } from "./auth-status.constants";
import { CheckEmailScreen } from "./check-email-screen";
import {
  emailVerificationPath,
  getEmailVerificationCallbackURL,
} from "./email-verification";
import { forgotPasswordPath } from "./password-reset";
import { ResendBanners, ResendButton } from "./resend-button";
import { useResendVerification } from "./use-resend-verification";

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

const STRONG = { strong: <strong className="font-semibold text-foreground" /> };
const LINK_CLASS = "font-semibold text-fg-link hover:underline";

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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formSent, setFormSent] = useState(false);
  const resend = useResendVerification();

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

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = email.trim();
    if (!target) {
      setEmailError(t("auth.verify.emailRequired"));
      return;
    }
    setEmailError(null);
    if (await resend.resend(target)) setFormSent(true);
  }

  function screen(props: Parameters<typeof StatusPanel>[0]) {
    return (
      <AuthCardPage>
        <AuthStatusCard>
          <StatusPanel {...props} />
        </AuthStatusCard>
      </AuthCardPage>
    );
  }

  const signInLink = (variant: "default" | "outline", label: string) => (
    <Button asChild className={AUTH_ACTION_CLASS} shape="xl" variant={variant}>
      <Link to="/login">{label}</Link>
    </Button>
  );

  switch (mode) {
    case "registration":
      return <CheckEmailScreen deliveryFailed={deliveryFailed} email={emailFromQuery || undefined} />;

    case "verifying":
      return screen({
        description: t("auth.verify.verifying.body"),
        icon: Loader2,
        iconClassName: "animate-spin",
        title: t("auth.verify.verifying.title"),
        tone: "info",
      });

    case "success":
      return screen({
        actions: signInLink("default", t("auth.verify.signIn")),
        description: t("auth.verify.success.body"),
        icon: Check,
        note: t("auth.verify.success.note"),
        title: t("auth.verify.success.title"),
        tone: "success",
      });

    case "already-verified":
      return screen({
        actions: signInLink("default", t("auth.verify.signIn")),
        description: t("auth.verify.alreadyVerified.body"),
        footer: (
          <>
            {t("auth.verify.alreadyVerified.forgot")}{" "}
            <Link className={LINK_CLASS} to={forgotPasswordPath}>
              {t("auth.verify.alreadyVerified.reset")}
            </Link>
          </>
        ),
        icon: Info,
        title: t("auth.verify.alreadyVerified.title"),
        tone: "info",
      });

    case "invalid":
      return screen({
        actions: (
          <>
            {signInLink("outline", t("auth.verify.goToSignIn"))}
            <Button asChild className={AUTH_ACTION_CLASS} shape="xl">
              <Link to={VERIFY_NEW_LINK_PATH}>{t("auth.verify.requestNewLink")}</Link>
            </Button>
          </>
        ),
        description: t("auth.verify.invalid.body"),
        icon: CircleX,
        note: t("auth.verify.invalid.note"),
        title: t("auth.verify.invalid.title"),
        tone: "danger",
      });

    case "retry-later":
      return screen({
        actions: signInLink("outline", t("auth.verify.goToSignIn")),
        description: t("auth.verify.retryLater.body"),
        icon: AlertTriangle,
        note: t("auth.verify.retryLater.note"),
        title: t("auth.verify.retryLater.title"),
        tone: "warning",
      });

    case "expired":
    default:
      break;
  }

  // Expired link with the account's address known: send a new link straight away.
  if (emailFromQuery) {
    return screen({
      actions: (
        <>
          {signInLink("outline", t("auth.verify.goToSignIn"))}
          <ResendButton
            idleLabel={t("auth.verify.sendNewLink")}
            onResend={() => void resend.resend(emailFromQuery)}
            resend={resend}
          />
        </>
      ),
      children: <ResendBanners resend={resend} />,
      description: t("auth.verify.expired.body"),
      icon: Clock3,
      note: t("auth.verify.expired.note"),
      title: t("auth.verify.expired.title"),
      tone: "warning",
    });
  }

  // The form was sent: the neutral "Check your email" result (same text for every address).
  if (formSent) {
    return screen({
      actions: (
        <>
          <ResendButton
            idleLabel={t("auth.verify.sendAgain")}
            onResend={() => void resend.resend(email.trim())}
            resend={resend}
            variant="outline"
          />
          <Button asChild className={AUTH_ACTION_CLASS} shape="xl">
            <Link to="/login">{t("auth.verify.backToSignIn")}</Link>
          </Button>
        </>
      ),
      children: <ResendBanners announceAfter={1} resend={resend} />,
      description: <Trans components={STRONG} i18nKey="auth.verify.sentResult.body" values={{ email: email.trim() }} />,
      icon: Mail,
      note: (
        <>
          {t("auth.verify.sentResult.note")}{" "}
          <button className={LINK_CLASS} onClick={() => setFormSent(false)} type="button">
            {t("auth.verify.sentResult.differentEmail")}
          </button>
        </>
      ),
      title: t("auth.verify.checkEmail.title"),
      tone: "success",
    });
  }

  // Expired link, no address known yet: the design's "Resend verification email" form.
  return (
    <AuthCardPage>
      <AuthStatusCard>
        <form className="flex flex-col gap-[22px]" noValidate onSubmit={handleFormSubmit}>
          <div className="flex flex-col gap-2">
            <h1 className="itt-display text-[30px] font-semibold tracking-[-0.01em] text-foreground">
              {t("auth.verify.form.title")}
            </h1>
            <p className="text-[14.5px] leading-[1.55] text-muted-foreground">{t("auth.verify.form.description")}</p>
          </div>
          {resend.errorMessage ? <ResendBanners resend={resend} /> : null}
          <FormField error={emailError ?? undefined} htmlFor="verification-email" label={t("auth.verify.emailAddress")} required>
            <Input
              aria-invalid={emailError ? true : undefined}
              id="verification-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.verify.emailPlaceholder")}
              type="email"
              value={email}
            />
          </FormField>
          <Button className={AUTH_FULL_ACTION_CLASS} disabled={resend.loading} shape="xl" type="submit">
            {resend.loading ? t("auth.verify.sending") : t("auth.verify.form.submit")}
          </Button>
          <p className="text-[13.5px]">
            <Link className={LINK_CLASS} to="/login">
              {t("auth.verify.backToSignIn")}
            </Link>
          </p>
        </form>
      </AuthStatusCard>
    </AuthCardPage>
  );
}

export { emailVerificationPath, getEmailVerificationCallbackURL };
