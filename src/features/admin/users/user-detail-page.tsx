import { Ban } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { Breadcrumb } from "@/components/common/breadcrumb";
import { ErrorState } from "@/components/common/error-state";
import { LoadingScreen } from "@/components/common/loading-screen";
import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import { ADMIN_USERS_PATH } from "@/config/routes";
import { userDisplayId } from "@/lib/display-id";
import { formatDate } from "@/lib/format";

import { SuspendUserDialog } from "./suspend-user-dialog";
import { RoleBadge, StatusBadge } from "./user-badges";
import { UserFormDialog } from "./user-form-dialog";
import { useUserDetailQuery } from "./users.queries";

export function AdminUserDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { data: user, error, isLoading } = useUserDetailQuery(userId);
  const [dialog, setDialog] = useState<"edit" | "suspend" | null>(null);

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

  const fields = [
    { label: t("adminUsers.detail.username"), value: user.username },
    { label: t("adminUsers.detail.email"), value: user.email },
    { label: t("adminUsers.detail.role"), value: <RoleBadge role={user.role} /> },
    { label: t("adminUsers.detail.accountStatus"), value: <StatusBadge status={user.status} /> },
    { label: t("adminUsers.detail.created"), value: user.createdAt ? formatDate(user.createdAt) : "—" },
    { label: t("adminUsers.detail.accountId"), value: <span className="itt-mono text-xs">{userDisplayId(user.id)}</span> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex">
        <Breadcrumb
          ariaLabel={t("adminUsers.detail.breadcrumb")}
          items={[{ label: t("adminUsers.page.title"), to: ADMIN_USERS_PATH }, { label: userDisplayId(user.id), mono: true }]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar tone="peach" className="size-12 text-[17px]" name={user.username} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="itt-display text-2xl font-semibold text-foreground">{user.username}</h1>
            <StatusBadge status={user.status} />
            <RoleBadge role={user.role} />
          </div>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
        <Button className="h-11 px-5" onClick={() => setDialog("edit")} shape="xl" type="button" variant="outline">
          {t("actions.edit")}
        </Button>
        <Button className="h-11 px-5" onClick={() => setDialog("suspend")} shape="xl" type="button" variant="destructive-solid">
          <Ban aria-hidden className="size-4" />
          {t("adminUsers.detail.suspend")}
        </Button>
      </div>

      <section className="flex max-w-[860px] flex-col gap-[18px] rounded-2xl border border-border bg-card px-[22px] pb-6 pt-[22px]">
        <h2 className="text-[15px] font-bold text-foreground">{t("adminUsers.detail.account")}</h2>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div className="flex min-w-0 flex-col gap-1.5" key={field.label}>
              <dt className="text-[13px] text-muted-foreground">{field.label}</dt>
              <dd className="m-0 wrap-anywhere text-[14.5px] font-semibold text-foreground">{field.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <UserFormDialog onOpenChange={(open) => !open && setDialog(null)} open={dialog === "edit"} user={user} />
      <SuspendUserDialog onOpenChange={(open) => !open && setDialog(null)} open={dialog === "suspend"} user={user} />
    </div>
  );
}
