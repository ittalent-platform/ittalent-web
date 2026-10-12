import { Ban, Check, Mail, Pencil, Repeat } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

import { Breadcrumb } from "@/components/common/breadcrumb";
import { ClampedText } from "@/components/common/clamped-text";
import { Field, FieldGrid } from "@/components/common/field-grid";
import { SectionCard } from "@/components/common/section-card";
import { ErrorState } from "@/components/common/error-state";
import { InlineBanner } from "@/components/common/inline-banner";
import { LoadingScreen } from "@/components/common/loading-screen";
import { PersonAvatar } from "@/components/common/person-avatar";
import { RailCard } from "@/components/common/rail-card";
import { TimelineList } from "@/components/common/timeline";
import { Button } from "@/components/ui/button";
import { ADMIN_USERS_PATH, adminEnterprisePath, adminUserPath } from "@/config/routes";
import { enterpriseDisplayId, userDisplayId } from "@/lib/display-id";
import { formatDate, formatDateTimeIct } from "@/lib/format";

import { ChangeUserEmailDialog } from "./change-user-email-dialog";
import { ChangeUserRoleDialog } from "./change-user-role-dialog";
import { useSession } from "@/auth/use-session";
import { SuspendUserDialog } from "./suspend-user-dialog";
import { useLatestSuspensionEvent } from "./suspension-notice";
import { EmailStatusBadge, RoleBadge, StatusBadge } from "./user-badges";
import { formatMobile, historyActorKey, userDisplayName } from "./user-display";
import { HISTORY_ACTION_TONE, HISTORY_PREVIEW_SIZE, HISTORY_TIME_ZONE_LABEL, type HistoryAction } from "./user-history.constants";
import { UserFormDialog } from "./user-form-dialog";
import { UserInvitationActions } from "./user-invitation-actions";
import { useUserDetailQuery, useUserHistoryQuery } from "./users.queries";

type DialogKind = "edit" | "suspend" | "role" | "emergency" | "email";

export function AdminUserDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { data: user, error, isLoading, refetch } = useUserDetailQuery(userId);
  const history = useUserHistoryQuery(userId ?? "", Boolean(userId), { limit: HISTORY_PREVIEW_SIZE });
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const { data: session } = useSession();
  const suspension = useLatestSuspensionEvent(userId ?? "", user?.status === "suspended");

  if (isLoading) return <LoadingScreen />;

  if (error || !user) {
    return (
      <ErrorState
        description={t("adminUsers.detail.notFoundDescription")}
        secondaryAction={{ label: t("adminUsers.detail.back"), onClick: () => navigate(ADMIN_USERS_PATH) }}
        title={t("adminUsers.detail.notFoundTitle")}
      />
    );
  }

  const reload = () => void refetch();
  const close = (open: boolean) => !open && setDialog(null);
  const name = userDisplayName(user);
  const roleLabel = t(`adminUsers.role.${user.role}`, { defaultValue: user.role });
  const subtitle = user.enterpriseName ? t("adminUsers.detail.roleAtCompany", { company: user.enterpriseName, role: roleLabel }) : roleLabel;
  const companyRole = user.role === "recruiter" || user.role === "enterprise_admin";
  // The API rejects self-suspension, so an administrator never sees Suspend on their own account.
  const isSelf = session?.user.id === user.id;
  const canToggleStatus = (user.status === "active" && !isSelf) || user.status === "suspended" || user.status === "blocked";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex">
        <Breadcrumb
          ariaLabel={t("adminUsers.detail.breadcrumb")}
          items={[{ label: t("adminUsers.page.title"), to: ADMIN_USERS_PATH }, { label: userDisplayId(user.id), mono: true }]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar tone="peach" className="size-12 text-[17px]" name={name} />
        <div className="flex min-w-[16rem] max-w-full flex-1 basis-[16rem] flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="itt-display min-w-0 max-w-full line-clamp-2 wrap-anywhere text-2xl font-semibold text-foreground" title={name}>{name}</h1>
            <StatusBadge status={user.status} />
          </div>
          <span className="line-clamp-2 wrap-anywhere text-sm text-muted-foreground" title={`${user.email} · ${subtitle}`}>{user.email} · {subtitle}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="xl" onClick={() => setDialog("edit")} shape="xl" type="button" variant="outline"><Pencil aria-hidden className="size-4" />{t("adminUsers.detail.edit")}</Button>
          {user.status === "active" && user.emailVerified ? <Button size="xl" onClick={() => setDialog("email")} shape="xl" type="button" variant="outline"><Mail aria-hidden className="size-4" />{t("adminUsers.emailChange.title")}</Button> : null}
          {user.status === "active" && companyRole ? <Button size="xl" onClick={() => setDialog("role")} shape="xl" type="button" variant="outline"><Repeat aria-hidden className="size-4" />{t("adminUsers.table.changeRole")}</Button> : null}
          {canToggleStatus ? (
            <Button size="xl" onClick={() => setDialog("suspend")} shape="xl" type="button" variant={user.status === "active" ? "destructive-solid" : "success-solid"}>
              {user.status === "active" ? <Ban aria-hidden className="size-4" /> : <Check aria-hidden className="size-4" />}
              {t(user.status === "active" ? "adminUsers.detail.suspend" : "adminUsers.table.reactivate")}
            </Button>
          ) : null}
          {user.status === "active" && user.role === "enterprise_admin" ? <Button size="xl" onClick={() => setDialog("emergency")} shape="xl" type="button" variant="destructive-outline">{t("adminUsers.detail.emergencySuspend")}</Button> : null}
        </div>
      </div>

      {user.status === "suspended" ? (
        <div className="flex gap-3 rounded-2xl border border-destructive/25 bg-(--status-error-bg) px-5 py-4 text-[13.5px]" role="alert">
          <Ban aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-semibold text-destructive">{suspension ? t("adminUsers.suspension.title", { actor: suspension.actor, date: suspension.date }) : t("adminUsers.suspension.unknown")}</p>
            {suspension ? <ClampedText className="text-foreground" text={suspension.reason} label={<b>{t("adminUsers.suspension.reasonLabel")}</b>} /> : null}
          </div>
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <UserInvitationActions onReload={reload} user={user} />

          <SectionCard id="user-personal" title={t("adminUsers.detail.personal")}>
            <FieldGrid>
              <Field label={t("adminUsers.detail.fullName")}><span className="wrap-anywhere">{user.fullName ?? "—"}</span></Field>
              <Field label={t("adminUsers.detail.mobile")}>{user.phone ? formatMobile(user.phone) : "—"}</Field>
              <Field label={t("adminUsers.detail.email")}>
                <span className="block wrap-anywhere">{user.email}</span>
                <span className="mt-1.5 block"><EmailStatusBadge verified={user.emailVerified} /></span>
              </Field>
              <Field label={t("adminUsers.detail.accountId")}><span className="itt-mono text-xs font-bold">{userDisplayId(user.id)}</span></Field>
            </FieldGrid>
          </SectionCard>

          <SectionCard id="user-access" title={t("adminUsers.detail.access")}>
            <FieldGrid>
              <Field label={t("adminUsers.detail.accountStatus")}><StatusBadge status={user.status} /></Field>
              <Field label={t("adminUsers.detail.role")}><RoleBadge role={user.role} /></Field>
              <Field label={t("adminUsers.detail.company")}>
                {user.enterpriseId ? (
                  <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                    <Link className="wrap-anywhere text-foreground underline underline-offset-4" to={adminEnterprisePath(user.enterpriseId)}>{user.enterpriseName ?? enterpriseDisplayId(user.enterpriseId)}</Link>
                    <span className="itt-mono text-xs font-semibold text-muted-foreground">{enterpriseDisplayId(user.enterpriseId)}</span>
                  </span>
                ) : "—"}
              </Field>
              <Field label={t("adminUsers.detail.created")}>{user.createdAt ? formatDate(user.createdAt) : "—"}</Field>
            </FieldGrid>
          </SectionCard>
        </div>

        <RailCard meta={history.data ? String(history.data.total) : undefined} title={t("adminUsers.detail.recentHistory")}>
          {history.isError ? <InlineBanner tone="error">{t("adminUsers.history.loadFailed")}</InlineBanner> : null}
          {history.data?.items.length === 0 ? <p className="text-[13px] text-muted-foreground">{t("adminUsers.history.empty")}</p> : null}
          {history.data?.items.length ? (
            <TimelineList
              entries={history.data.items.map((item) => ({
                atIso: item.occurredAt,
                by: item.actorName ?? t(`adminUsers.history.${historyActorKey(item.actorId, user.id)}`),
                label: t(`adminUsers.history.${item.action}`, { defaultValue: item.action }),
                tone: HISTORY_ACTION_TONE[item.action as HistoryAction] ?? "info",
              }))}
              formatDate={(iso) => `${formatDateTimeIct(iso)} ${HISTORY_TIME_ZONE_LABEL}`}
            />
          ) : null}
          {history.data ? <Link className="text-[13px] font-semibold text-fg-link underline-offset-4 hover:underline" to={`${adminUserPath(user.id)}/history`}>{t("adminUsers.history.viewAllCount", { count: history.data.total })}</Link> : null}
        </RailCard>
      </div>

      {dialog === "edit" ? <UserFormDialog onChangeEmail={() => setDialog("email")} onOpenChange={close} onReload={reload} open user={user} /> : null}
      {dialog === "suspend" ? <SuspendUserDialog onOpenChange={close} onReload={reload} open user={user} /> : null}
      {dialog === "role" ? <ChangeUserRoleDialog onOpenChange={close} onReload={reload} open user={user} /> : null}
      {dialog === "emergency" ? <SuspendUserDialog emergency onOpenChange={close} onReload={reload} open user={user} /> : null}
      {dialog === "email" ? <ChangeUserEmailDialog onOpenChange={close} open user={user} /> : null}
    </div>
  );
}

