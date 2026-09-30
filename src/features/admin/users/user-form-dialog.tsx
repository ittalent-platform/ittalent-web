import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import type { PatchApiV1UsersByIdData, UserDto } from "@/api/generated/types.gen";
import { useSession } from "@/auth/use-session";
import { FormField, FormSectionLabel } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { PersonAvatar } from "@/components/common/person-avatar";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { userDisplayId } from "@/lib/display-id";
import { formatDate } from "@/lib/format";

import { userDisplayName } from "./user-display";
import {
  EMAIL_MAX_LENGTH,
  FULL_NAME_HINT_RANGE,
  PHONE_NOISE,
  PHONE_PATTERN,
  USER_FORM_ROLES,
  USER_FORM_STATUSES,
  type UserFormRole,
  type UserFormStatus,
} from "./users.constants";
import { useUpdateUserMutation } from "./users.queries";

type UserFormDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** Present when editing; absent when creating an internal user. */
  user?: UserDto;
};

type FormValues = { email: string; fullName: string; phone: string };
type UserPatch = PatchApiV1UsersByIdData["body"];

const HTTP_SERVER_ERROR = 500;

const roleOf = (user?: UserDto): UserFormRole => (user?.role === "admin" ? "admin" : "applicant");

/** Only what the administrator changed: the API edits exactly the fields it receives. */
export function buildUserPatch(user: UserDto, values: Pick<FormValues, "fullName" | "phone">, role: UserFormRole): UserPatch {
  const patch: UserPatch = {};
  const fullName = values.fullName.trim();
  if (fullName !== (user.fullName ?? "")) patch.fullName = fullName;
  const phone = values.phone.replace(PHONE_NOISE, "");
  if (phone !== (user.phone ?? "")) patch.phone = phone === "" ? null : phone;
  if (role !== roleOf(user)) patch.role = role === "admin" ? "admin" : "user";
  return patch;
}

/**
 * Create internal user / Edit user (Users design). Editing saves the full name, mobile number and role; the email
 * (the sign-in identity) and the status stay read-only. Creating an account is not supported yet: a new account
 * needs a way to receive its credentials, so that form keeps a disabled submit and says so.
 */
export function UserFormDialog({ onOpenChange, open, user }: UserFormDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const mutation = useUpdateUserMutation();
  const editing = Boolean(user);
  const ownAccount = Boolean(user && session?.user.id === user.id);
  const [role, setRole] = useState<UserFormRole>(roleOf(user));
  const [status, setStatus] = useState<UserFormStatus>("active");
  const [failure, setFailure] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string(),
        fullName: z.string().trim().min(FULL_NAME_HINT_RANGE.min, "fullName").max(FULL_NAME_HINT_RANGE.max, "fullName"),
        phone: z
          .string()
          .trim()
          .refine((value) => value === "" || PHONE_PATTERN.test(value.replace(PHONE_NOISE, "")), "phone"),
      }),
    [],
  );
  const form = useForm<FormValues>({
    defaultValues: { email: user?.email ?? "", fullName: user?.fullName ?? "", phone: user?.phone ?? "" },
    mode: "onBlur",
    resolver: zodResolver(schema),
  });
  const [fullName = "", phone = ""] = useWatch({ control: form.control, name: ["fullName", "phone"] });
  const changed = user ? Object.keys(buildUserPatch(user, { fullName, phone }, role)).length > 0 : false;
  const errors = form.formState.errors;

  const save = form.handleSubmit(async (values) => {
    if (!user) return;
    const body = buildUserPatch(user, values, role);
    if (!Object.keys(body).length) return;
    setFailure(null);
    try {
      const updated = await mutation.mutateAsync({ body, id: user.id });
      showToast({ message: t("adminUsers.form.savedMessage", { name: userDisplayName(updated) }), title: t("adminUsers.form.saved"), tone: "success" });
      onOpenChange(false);
    } catch (error) {
      const status = (error as { status?: number }).status;
      // The API explains a rejected edit (for example "You can't change your own role"); a server fault gets a generic line.
      setFailure(status !== undefined && status < HTTP_SERVER_ERROR && error instanceof Error ? error.message : t("adminUsers.form.saveFailed"));
    }
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[560px] gap-0 overflow-hidden rounded-[20px] p-0">
        <DialogHeader className="pr-14">
          {editing && user ? (
            <div className="flex items-center gap-3.5">
              <PersonAvatar tone="peach" className="size-10 text-[13px]" name={userDisplayName(user)} />
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

        <form className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-[26px] py-5" id="user-form" noValidate onSubmit={save}>
          {editing ? null : <InlineBanner tone="info">{t("adminUsers.form.unavailable")}</InlineBanner>}
          {failure ? <InlineBanner tone="error">{failure}</InlineBanner> : null}

          <FormSectionLabel>{t("adminUsers.form.identity")}</FormSectionLabel>
          <FormField
            error={errors.fullName ? t("adminUsers.form.fullNameError", FULL_NAME_HINT_RANGE) : undefined}
            hint={t("adminUsers.form.fullNameHint", FULL_NAME_HINT_RANGE)}
            htmlFor="user-full-name"
            label={t("adminUsers.form.fullName")}
            required
          >
            <Input aria-invalid={Boolean(errors.fullName)} id="user-full-name" placeholder={t("adminUsers.form.fullNamePlaceholder")} {...form.register("fullName")} />
          </FormField>
          <FormField
            hint={editing ? t("adminUsers.form.emailLocked") : t("adminUsers.form.emailHint", { max: EMAIL_MAX_LENGTH })}
            htmlFor="user-email"
            label={t("adminUsers.form.email")}
            required
          >
            <Input disabled={editing} id="user-email" placeholder={t("adminUsers.form.emailPlaceholder")} type="email" {...form.register("email")} />
          </FormField>
          <FormField
            error={errors.phone ? t("adminUsers.form.mobileError") : undefined}
            hint={t("adminUsers.form.mobileHint")}
            htmlFor="user-mobile"
            label={t("adminUsers.form.mobile")}
          >
            <Input aria-invalid={Boolean(errors.phone)} id="user-mobile" inputMode="tel" placeholder={t("adminUsers.form.mobilePlaceholder")} type="tel" {...form.register("phone")} />
          </FormField>

          <div className="flex flex-col gap-5 border-t border-border pt-5">
            <FormSectionLabel>{t(editing ? "adminUsers.form.access" : "adminUsers.form.accessPermissions")}</FormSectionLabel>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-[13.5px] font-semibold">
                  {t("adminUsers.form.role")} <span className="text-(--field-error)">*</span>
                </span>
                <SegmentedToggle
                  disabled={ownAccount}
                  onChange={setRole}
                  options={USER_FORM_ROLES.map((value) => ({ label: t(`adminUsers.role.${value === "admin" ? "admin" : "user"}`), value }))}
                  value={role}
                />
                {ownAccount ? <p className="text-[12.5px] leading-normal text-muted-foreground">{t("adminUsers.form.roleLocked")}</p> : null}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13.5px] font-semibold">
                  {t(editing ? "adminUsers.form.accountStatus" : "adminUsers.form.status")}{" "}
                  {editing ? null : <span className="text-(--field-error)">*</span>}
                </span>
                {editing && user ? (
                  <div className="flex h-[42px] items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-[13.5px] font-semibold">
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
          <Button
            className="h-11 px-5"
            disabled={!editing || !changed || mutation.isPending}
            form="user-form"
            shape="xl"
            title={editing && !changed ? t("adminUsers.form.noChanges") : undefined}
            type="submit"
          >
            {mutation.isPending ? t("adminUsers.form.saving") : t(editing ? "adminUsers.form.save" : "adminUsers.form.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
