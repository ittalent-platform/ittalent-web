import { Check, Circle, Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

import { postApiV1UserEmailChangesConfirm } from "@/api/generated";
import { useSession } from "@/auth/use-session";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AUTH_FULL_ACTION_CLASS } from "./auth-status.constants";
import { AuthCardPage, AuthFactsBox, AuthFormHeader, AuthStatusCard } from "./auth-status-card";
import { HTTP_CONFLICT, HTTP_FORBIDDEN, HTTP_GONE, HTTP_TOO_MANY_REQUESTS } from "./invitation.constants";

const FAILURE_KEY: Record<number, string> = {
  [HTTP_CONFLICT]: "accountEmailChange.conflict",
  [HTTP_FORBIDDEN]: "accountEmailChange.wrongPassword",
};

export function ConfirmEmailChangePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { data: session, isPending } = useSession();
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState<{ status: number; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !password) return;
    setBusy(true);
    setFailure(null);
    try {
      const result = await postApiV1UserEmailChangesConfirm({ body: { token, currentPassword: password } });
      if (result.error || !result.data) {
        const status = result.response?.status ?? 0;
        setFailure({ status, message: t(FAILURE_KEY[status] ?? "accountEmailChange.failed") });
        return;
      }
      setDone(true);
      setPassword("");
    } finally { setBusy(false); }
  }

  const action = (to: string, label: string, variant: "default" | "outline" = "outline") => (
    <Button asChild className={AUTH_FULL_ACTION_CLASS} shape="xl" variant={variant}><Link to={to}>{label}</Link></Button>
  );
  const backToAccount = action("/", t("accountEmailChange.backToAccount"));

  const content = done ? <StatusPanel actions={action("/login", t("accountEmailChange.signInAgain"), "default")} description={t("accountEmailChange.successDescription")} icon={Check} title={t("accountEmailChange.successTitle")} tone="success" />
    : !token || failure?.status === HTTP_GONE ? <StatusPanel actions={backToAccount} description={t(token ? "accountEmailChange.expired" : "accountEmailChange.missingToken")} icon={TriangleAlert} title={t("accountEmailChange.invalidTitle")} tone="warning" />
    : failure?.status === HTTP_TOO_MANY_REQUESTS ? (
      <StatusPanel actions={backToAccount} icon={Circle} iconClassName="size-3.5" title={t("accountEmailChange.rateLimitedTitle")} tone="danger">
        <p className="rounded-xl border border-border bg-(--status-neutral-bg)/60 px-4 py-3 text-[13.5px] leading-[1.5] text-muted-foreground">{t("accountEmailChange.rateLimited")}</p>
      </StatusPanel>
    )
    : isPending ? <p className="text-sm text-muted-foreground" role="status">{t("state.loading")}</p>
    : !session ? <StatusPanel actions={action(`/login?next=${encodeURIComponent(`/confirm-email-change?token=${token}`)}`, t("accountInvitation.signIn"), "default")} description={t("accountEmailChange.signInDescription")} icon={MailCheck} title={t("accountEmailChange.signInTitle")} tone="info" />
    : (
      <div className="flex flex-col gap-[22px]">
        <AuthFormHeader description={t("accountEmailChange.description")} title={t("accountEmailChange.title")} />
        <AuthFactsBox rows={[{ label: t("accountEmailChange.from"), value: session.user.email }]} />
        {failure && failure.status !== HTTP_FORBIDDEN ? <InlineBanner tone="error">{failure.message}</InlineBanner> : null}
        <form className="flex flex-col gap-5" onSubmit={(event) => void confirm(event)}>
          <FormField error={failure?.status === HTTP_FORBIDDEN ? failure.message : undefined} htmlFor="confirm-email-password" label={t("accountEmailChange.password")}>
            <Input aria-invalid={failure?.status === HTTP_FORBIDDEN} autoComplete="current-password" disabled={busy} id="confirm-email-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          </FormField>
          <div className="flex flex-col items-center gap-3">
            <Button className={AUTH_FULL_ACTION_CLASS} disabled={busy || !password} shape="xl" type="submit">
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}{t("accountEmailChange.confirm")}
            </Button>
            <Link className="text-[13.5px] font-semibold text-muted-foreground hover:text-foreground hover:underline" to="/">{t("accountEmailChange.notNow")}</Link>
          </div>
        </form>
      </div>
    );

  return (
    <AuthCardPage tone="employer">
      <AuthStatusCard className="max-w-[460px]">{content}</AuthStatusCard>
    </AuthCardPage>
  );
}
