import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { UserDto } from "@/api/generated/types.gen";
import { FormField, FormSectionLabel } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { userDisplayId } from "@/lib/display-id";
import { formatDate } from "@/lib/format";

import {
  EMAIL_MAX_LENGTH,
  FULL_NAME_HINT_RANGE,
  USER_FORM_ROLES,
  USER_FORM_STATUSES,
  type UserFormRole,
  type UserFormStatus,
} from "./users.constants";

type UserFormDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** Present when editing; absent when creating an internal user. */
  user?: UserDto;
};

/**
 * Create internal user / Edit user (Users design). Editing keeps the status read-only. The users API has no write
 * endpoints yet, so the submit button stays disabled and the dialog says so.
 */
export function UserFormDialog({ onOpenChange, open, user }: UserFormDialogProps) {
  const { t } = useTranslation();
  const editing = Boolean(user);
  const [role, setRole] = useState<UserFormRole>(user?.role === "admin" ? "admin" : "applicant");
  const [status, setStatus] = useState<UserFormStatus>("active");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[560px] gap-0 overflow-hidden rounded-[20px] p-0">
        <DialogHeader className="pr-14">
          {editing && user ? (
            <div className="flex items-center gap-3.5">
              <PersonAvatar tone="peach" className="size-10 text-[13px]" name={user.username} />
              <div className="flex min-w-0 flex-col gap-[3px]">
                <DialogTitle className="text-xl">{t("adminUsers.form.editTitle")}</DialogTitle>
                <DialogDescription className="itt-mono">
                  {userDisplayId(user.id)}
                  {user.createdAt ? ` · ${t("adminUsers.form.created", { date: formatDate(user.createdAt) })}` : ""}
                </DialogDescription>
              </div>
            </div>
          ) : (
            <>
              <DialogTitle className="text-xl">{t("adminUsers.form.createTitle")}</DialogTitle>
              <DialogDescription>{t("adminUsers.form.createDescription")}</DialogDescription>
            </>
          )}
        </DialogHeader>

        <form className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-[26px] py-5" onSubmit={(event) => event.preventDefault()}>
          <InlineBanner tone="info">{t("adminUsers.form.unavailable")}</InlineBanner>

          <FormSectionLabel>{t("adminUsers.form.identity")}</FormSectionLabel>
          <FormField
            hint={t("adminUsers.form.fullNameHint", FULL_NAME_HINT_RANGE)}
            htmlFor="user-full-name"
            label={t("adminUsers.form.fullName")}
            required
          >
            <Input defaultValue={user?.username} id="user-full-name" placeholder={t("adminUsers.form.fullNamePlaceholder")} />
          </FormField>
          <FormField
            hint={t("adminUsers.form.emailHint", { max: EMAIL_MAX_LENGTH })}
            htmlFor="user-email"
            label={t("adminUsers.form.email")}
            required
          >
            <Input defaultValue={user?.email} id="user-email" placeholder={t("adminUsers.form.emailPlaceholder")} type="email" />
          </FormField>

          <div className="flex flex-col gap-5 border-t border-border pt-5">
            <FormSectionLabel>{t(editing ? "adminUsers.form.access" : "adminUsers.form.accessPermissions")}</FormSectionLabel>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-[13.5px] font-semibold">
                  {t("adminUsers.form.role")} <span className="text-(--field-error)">*</span>
                </span>
                <SegmentedToggle
                  onChange={setRole}
                  options={USER_FORM_ROLES.map((value) => ({ label: t(`adminUsers.role.${value === "admin" ? "admin" : "user"}`), value }))}
                  value={role}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13.5px] font-semibold">
                  {t(editing ? "adminUsers.form.accountStatus" : "adminUsers.form.status")}{" "}
                  {editing ? null : <span className="text-(--field-error)">*</span>}
                </span>
                {editing && user ? (
                  <div className="flex h-[42px] items-center gap-2.5 rounded-md border border-border bg-card px-3 text-[13.5px] font-semibold">
                    <span className="grid size-[22px] place-items-center rounded-full bg-(--status-success-fg) text-white">
                      <Check aria-hidden className="size-3.5" strokeWidth={3} />
                    </span>
                    {t(`adminUsers.status.${user.status}`, { defaultValue: user.status })}
                    {user.createdAt ? (
                      <span className="ml-auto text-[12.5px] font-normal text-muted-foreground">
                        {t("adminUsers.form.since", { date: formatDate(user.createdAt) })}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <SegmentedToggle
                    onChange={setStatus}
                    options={USER_FORM_STATUSES.map((value) => ({ label: t(`adminUsers.status.${value}`), value }))}
                    value={status}
                  />
                )}
              </div>
            </div>
            {editing ? <p className="text-[12.5px] leading-normal text-muted-foreground">{t("adminUsers.form.statusNote")}</p> : null}
          </div>
        </form>

        <DialogFooter>
          <Button className="h-11 px-5" onClick={() => onOpenChange(false)} shape="xl" type="button" variant="outline">
            {t("actions.cancel")}
          </Button>
          <Button className="h-11 px-5" disabled shape="xl" type="submit">
            {t(editing ? "adminUsers.form.save" : "adminUsers.form.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
