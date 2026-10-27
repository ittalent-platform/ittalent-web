import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, Circle, Loader2, TriangleAlert, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";

import { InlineBanner } from "@/components/common/inline-banner";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { formatDateTimeIct } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AUTH_FULL_ACTION_CLASS } from "./auth-status.constants";
import { AuthCardPage, AuthFormHeader, AuthStatusCard } from "./auth-status-card";
import { acceptAccountInvitation, previewAccountInvitation } from "./invitation.queries";
import { PasswordField } from "./password-field";
import { PASSWORD_RULES } from "@/lib/password-rules";
import { strongPasswordSchema } from "./password-schema";
import { HTTP_BAD_REQUEST, HTTP_CONFLICT, HTTP_GONE } from "@/api/http-status";
import { KeyValueBox } from "@/components/common/key-value-box";

const schema = z.object({ password: strongPasswordSchema, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"], message: "mismatch" });
type InvitationForm = z.infer<typeof schema>;

const statusOf = (error: unknown) => (error as { status?: number } | null)?.status;

/** One line per password rule: neutral until the person types, then green when met and red when not. */
function PasswordRuleList({ password }: { password: string }) {
  const { t } = useTranslation();
  const touched = password.length > 0;
  return (
    <ul aria-live="polite" className="flex flex-col gap-1 text-[13px]">
      {PASSWORD_RULES.map(({ id, test }) => {
        const ok = test(password);
        const Icon = !touched ? Circle : ok ? Check : X;
        return (
          <li className={cn("flex items-center gap-2", !touched ? "text-muted-foreground" : ok ? "text-(--status-success-fg)" : "text-destructive")} key={id}>
            <Icon aria-hidden className={touched ? "size-3.5" : "size-2"} strokeWidth={touched ? 2.5 : 2} />
            {t(`accountInvitation.rule.${id}`)}
          </li>
        );
      })}
    </ul>
  );
}

export function AcceptInvitationPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [rejectedStatus, setRejectedStatus] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useQuery({
    enabled: Boolean(token) && !done,
    queryKey: ["account-invitation-preview", token],
    queryFn: () => previewAccountInvitation(token),
    retry: false,
  });
  const form = useForm<InvitationForm>({ defaultValues: { password: "", confirmPassword: "" }, resolver: zodResolver(schema), mode: "onChange" });
  const [password = "", confirmPassword = ""] = useWatch({ control: form.control, name: ["password", "confirmPassword"] });
  const status = rejectedStatus ?? statusOf(preview.error);
  const invite = preview.data;
  const company = invite?.enterpriseName ?? t("accountInvitation.companyFallback");
  const role = invite ? t(`adminUsers.role.${invite.role}`) : "";

  async function submit(values: InvitationForm) {
    setFailure(null);
    setBusy(true);
    try {
      await acceptAccountInvitation({ token, password: values.password });
      setDone(true);
      form.reset();
    } catch (error) {
      const code = statusOf(error);
      if (code === HTTP_GONE || code === HTTP_CONFLICT) setRejectedStatus(code);
      else setFailure(code === HTTP_BAD_REQUEST && error instanceof Error ? error.message : t("accountInvitation.failed"));
    } finally {
      setBusy(false);
    }
  }

  const panel = (props: Parameters<typeof StatusPanel>[0]) => <StatusPanel {...props} />;
  const signIn = (variant: "default" | "outline", label: string) => (
    <Button asChild className={AUTH_FULL_ACTION_CLASS} shape="xl" variant={variant}><Link to="/login">{label}</Link></Button>
  );

  let content: ReactNode;
  if (done) {
    content = panel({
      actions: signIn("default", t("accountInvitation.signIn")),
      description: invite?.enterpriseName
        ? t("accountInvitation.successDescriptionCompany", { company: invite.enterpriseName, email: invite.email, role })
        : invite ? t("accountInvitation.successDescription", { email: invite.email, role }) : undefined,
      icon: Check,
      title: t("accountInvitation.successTitle"),
      tone: "success",
    });
  } else if (!token || status === HTTP_GONE) {
    content = panel({
      actions: signIn("outline", t("accountInvitation.goToSignIn")),
      children: <p className="rounded-xl border border-border bg-(--status-neutral-bg)/60 px-4 py-3 text-[13.5px] leading-[1.5] text-muted-foreground">{t("accountInvitation.invalidNote")}</p>,
      description: t("accountInvitation.invalidDescription"),
      icon: TriangleAlert,
      title: t("accountInvitation.invalidTitle"),
      tone: "warning",
    });
  } else if (status === HTTP_CONFLICT) {
    content = panel({
      actions: <Button className={AUTH_FULL_ACTION_CLASS} onClick={() => { setRejectedStatus(null); void preview.refetch(); }} shape="xl" type="button" variant="outline">{t("accountInvitation.tryAgain")}</Button>,
      description: invite?.enterpriseName ? t("accountInvitation.companyDescription", { company: invite.enterpriseName }) : t("accountInvitation.companyDescriptionGeneric"),
      icon: Building2,
      title: t("accountInvitation.companyTitle", { company }),
      tone: "warning",
    });
  } else if (preview.isError) {
    content = panel({
      actions: <Button className={AUTH_FULL_ACTION_CLASS} onClick={() => void preview.refetch()} shape="xl" type="button" variant="outline">{t("actions.retry")}</Button>,
      description: t("accountInvitation.failed"),
      icon: TriangleAlert,
      title: t("accountInvitation.errorTitle"),
      tone: "warning",
    });
  } else if (preview.isPending) {
    content = <p className="text-sm text-muted-foreground" role="status">{t("state.loading")}</p>;
  } else {
    const data = preview.data;
    const passwordError = form.formState.errors.password && password ? t("accountInvitation.passwordRules") : undefined;
    content = (
      <div className="flex flex-col gap-[22px]">
        <AuthFormHeader
          description={data.enterpriseName ? t("accountInvitation.descriptionCompany", { company: data.enterpriseName }) : t("accountInvitation.description")}
          title={t("accountInvitation.title")}
        />
        <KeyValueBox
          rows={[
            { label: t("accountInvitation.email"), value: data.email },
            { label: t("accountInvitation.role"), value: role },
            ...(data.enterpriseName ? [{ label: t("accountInvitation.company"), value: data.enterpriseName }] : []),
          ]}
        />
        {failure ? <InlineBanner tone="error">{failure}</InlineBanner> : null}
        <form className="flex flex-col gap-5" noValidate onSubmit={form.handleSubmit(submit)}>
          <fieldset className="flex flex-col gap-5" disabled={busy}>
            <div className="flex flex-col gap-2.5">
              <PasswordField error={passwordError} id="invite-password" label={t("accountInvitation.password")} registration={form.register("password")} />
              <PasswordRuleList password={password} />
            </div>
            <PasswordField error={form.formState.errors.confirmPassword && confirmPassword ? t("accountInvitation.passwordMismatch") : undefined} id="invite-confirm-password" label={t("accountInvitation.confirmPassword")} registration={form.register("confirmPassword")} />
          </fieldset>
          <Button className={AUTH_FULL_ACTION_CLASS} disabled={busy || !form.formState.isValid} shape="xl" type="submit">
            {busy ? <><Loader2 aria-hidden className="size-4 animate-spin" />{t("accountInvitation.activating")}</> : t("accountInvitation.accept")}
          </Button>
        </form>
        {data.expiresAt ? <p className="text-[13px] text-muted-foreground">{t("accountInvitation.expiresNote", { date: formatDateTimeIct(data.expiresAt) })}</p> : null}
      </div>
    );
  }

  return (
    <AuthCardPage tone="employer">
      <AuthStatusCard className="max-w-[460px]">{content}</AuthStatusCard>
    </AuthCardPage>
  );
}
