import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Search, Send, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";

import type { CreateAdminUserRequest, CreateAdminUserResponse, PatchApiV1UsersByIdData, UserDto } from "@/api/generated/types.gen";
import { ActionConfirmDialog, DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { Callout } from "@/components/common/callout";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { LogoTile } from "@/components/common/logo-tile";
import { useToast } from "@/components/toast/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { adminUserPath } from "@/config/routes";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { classifyAccountError } from "./account-error";
import { InvitationNotDeliveredDialog } from "./invitation-not-delivered-dialog";
import { UserDialogHeader, LockedEmailInput } from "./user-dialog-header";
import { normalizeMobile, userShortName } from "./user-display";
import {
  EMAIL_MAX_LENGTH,
  FULL_NAME_HINT_RANGE,
  PHONE_NOISE,
  PHONE_PATTERN,
  USERNAME_HINT_RANGE,
  USERNAME_PATTERN,
  USER_FORM_ROLES,
  type UserFormRole,
} from "./users.constants";
import { useActiveEnterprisesQuery, useCreateUserMutation, useUpdateUserMutation } from "./users.queries";

type UserFormDialogProps = {
  /** Edit mode: opens the separate "Change email" flow, since email is not editable here. */
  onChangeEmail?: () => void;
  /** Create mode: called with the new account once it exists (even if its invitation was not delivered). */
  onCreated?: (user: CreateAdminUserResponse["user"]) => void;
  onOpenChange: (open: boolean) => void;
  /** Edit mode: refetches the account after a stale-version conflict so the dialog can show the saved values. */
  onReload?: () => void;
  open: boolean;
  user?: UserDto;
};

type FormValues = { email: string; fullName: string; username: string; phone: string; role: string; enterpriseId: string };
type UserPatch = PatchApiV1UsersByIdData["body"];

export function buildUserPatch(user: UserDto, values: Pick<FormValues, "fullName" | "phone">): UserPatch {
  const patch: UserPatch = { expectedVersion: user.version ?? 0 };
  const fullName = values.fullName.trim();
  if (fullName !== (user.fullName ?? "")) patch.fullName = fullName;
  const phone = values.phone.replace(PHONE_NOISE, "");
  if (phone !== (user.phone ?? "")) patch.phone = phone === "" ? null : phone;
  return patch;
}

/** Small blue pill beside a label while the value differs from the saved one. */
function ChangedPill() {
  const { t } = useTranslation();
  return <span className="rounded-full bg-(--status-info-bg) px-2 py-0.5 text-[11px] font-semibold text-(--status-info-fg)">{t("adminUsers.form.changed")}</span>;
}

export function UserFormDialog({ onChangeEmail, onCreated, onOpenChange, onReload, open, user }: UserFormDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const updateMutation = useUpdateUserMutation();
  const createMutation = useCreateUserMutation();
  const editing = Boolean(user);
  const [failure, setFailure] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [undelivered, setUndelivered] = useState<CreateAdminUserResponse["user"] | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [companyPage, setCompanyPage] = useState(1);
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [selectedEnterpriseLabel, setSelectedEnterpriseLabel] = useState("");
  const debouncedCompanySearch = useDebouncedValue(companySearch, 250);
  const enterprisesQuery = useActiveEnterprisesQuery(debouncedCompanySearch, companyPage, !editing);

  const schema = useMemo(() => z.object({
    email: editing ? z.string() : z.string().trim().email("email").max(EMAIL_MAX_LENGTH),
    fullName: z.string().trim().min(FULL_NAME_HINT_RANGE.min, "fullName").max(FULL_NAME_HINT_RANGE.max, "fullName"),
    username: editing ? z.string() : z.string().trim().toLowerCase().min(USERNAME_HINT_RANGE.min, "username").max(USERNAME_HINT_RANGE.max, "username").regex(USERNAME_PATTERN, "username"),
    phone: z.string().trim().refine((value) => value === "" || PHONE_PATTERN.test(value.replace(PHONE_NOISE, "")), "phone"),
    role: z.string(),
    enterpriseId: z.string(),
  }).superRefine((values, context) => {
    if (!editing && !USER_FORM_ROLES.includes(values.role as UserFormRole)) {
      context.addIssue({ code: "custom", path: ["role"], message: "role" });
    }
    if (!editing && (values.role === "recruiter" || values.role === "enterprise_admin") && !values.enterpriseId) {
      context.addIssue({ code: "custom", path: ["enterpriseId"], message: "enterpriseRequired" });
    }
  }), [editing]);

  const form = useForm<FormValues>({
    defaultValues: {
      email: user?.email ?? "",
      fullName: user?.fullName ?? "",
      username: user?.username ?? "",
      phone: user?.phone ?? "",
      role: user?.role === "recruiter" || user?.role === "enterprise_admin" ? user.role : "user",
      enterpriseId: user?.enterpriseId ?? "",
    },
    mode: "onBlur",
    resolver: zodResolver(schema),
  });
  const phoneField = form.register("phone");
  const [fullName = "", phone = "", role = "user", enterpriseId = ""] = useWatch({ control: form.control, name: ["fullName", "phone", "role", "enterpriseId"] });
  const changed = user ? Object.keys(buildUserPatch(user, { fullName, phone })).some((key) => key !== "expectedVersion") : form.formState.isDirty;
  const nameChanged = Boolean(user) && fullName.trim() !== (user?.fullName ?? "");
  const phoneChanged = Boolean(user) && phone.replace(PHONE_NOISE, "") !== (user?.phone ?? "");
  const errors = form.formState.errors;
  const requiresEnterprise = role === "recruiter" || role === "enterprise_admin";
  const enterpriseItems = enterprisesQuery.data?.items ?? [];
  const selectedEnterpriseName = enterpriseItems.find((enterprise) => enterprise.id === enterpriseId)?.name ?? selectedEnterpriseLabel;

  async function save(values: FormValues) {
    setFailure(null);
    try {
      if (user) {
        const body = buildUserPatch(user, values);
        if (!Object.keys(body).some((key) => key !== "expectedVersion")) return;
        const updated = await updateMutation.mutateAsync({ body, id: user.id });
        showToast({ message: t("adminUsers.form.savedMessage", { name: userShortName(updated) }), title: t("adminUsers.form.saved"), tone: "success" });
      } else {
        const body: CreateAdminUserRequest = {
          email: values.email.trim().toLowerCase(),
          username: values.username.trim().toLowerCase(),
          fullName: values.fullName.trim(),
          ...(values.phone.trim() ? { phone: values.phone.replace(PHONE_NOISE, "") } : {}),
          role: values.role as UserFormRole,
          ...(requiresEnterprise ? { enterpriseId: values.enterpriseId } : {}),
        };
        const created = await createMutation.mutateAsync(body);
        onCreated?.(created.user);
        if (created.invitation.deliveryStatus !== "sent") {
          showToast({ message: t("adminUsers.form.inviteFailed", { email: created.user.email }), title: t("adminUsers.form.createdNoInvite"), tone: "warning" });
          setUndelivered(created.user);
          form.reset();
          onOpenChange(false);
          return;
        }
        showToast({ action: { label: t("adminUsers.form.view"), onClick: () => navigate(adminUserPath(created.user.id)) }, message: t("adminUsers.form.createdSent", { name: userShortName(created.user) }), title: t("adminUsers.form.createdTitle"), tone: "success" });
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const kind = classifyAccountError(error);
      if (user && kind !== "server" && kind !== "other") {
        setConflict(true);
        onReload?.();
      } else if (kind === "accountConflict") {
        setFailure(t("adminUsers.errors.accountConflict.body"));
      } else if (kind === "companyUnavailable") {
        setFailure(t("adminUsers.errors.companyUnavailable.body"));
      } else if (kind === "onboardingPending") {
        setFailure(t("adminUsers.errors.onboardingPending.body"));
      } else {
        setFailure(kind === "other" && error instanceof Error ? error.message : t(user ? "adminUsers.form.saveFailed" : "adminUsers.form.createFailed"));
      }
    }
  }

  const pending = updateMutation.isPending || createMutation.isPending;
  const loadLatest = () => {
    form.reset({ fullName: user?.fullName ?? "", phone: user?.phone ?? "" });
    setConflict(false);
  };
  const conflictRows = user ? [
    { label: t("adminUsers.form.fullName"), now: user.fullName ?? "—", yours: fullName.trim() || "—", differs: fullName.trim() !== (user.fullName ?? "") },
    { label: t("adminUsers.form.mobile"), now: user.phone ?? "—", yours: phone.replace(PHONE_NOISE, "") || "—", differs: phone.replace(PHONE_NOISE, "") !== (user.phone ?? "") },
  ].filter((row) => row.differs) : [];

  function reset() {
    form.reset();
    setFailure(null);
    setConflict(false);
    onOpenChange(false);
  }

  function requestClose() {
    if (changed) {
      setConfirmDiscard(true);
      return;
    }
    reset();
  }

  return (
    <>
    <Dialog onOpenChange={(next) => { if (!next) requestClose(); }} open={open}>
      <DialogContent className={`max-h-[92vh] ${editing ? "max-w-[540px]" : "max-w-[720px]"} gap-0 overflow-hidden rounded-2xl p-0`}>
        {editing && user ? (
          <UserDialogHeader title={t("adminUsers.form.editTitle")} user={user} />
        ) : (
          <DialogHeader className="pr-14">
            <DialogTitle className="text-xl">{t("adminUsers.form.createTitle")}</DialogTitle>
            <DialogDescription>{t("adminUsers.form.createDescription")}</DialogDescription>
          </DialogHeader>
        )}

        <form className="max-h-[calc(92vh-210px)] overflow-y-auto px-6 py-5" id="user-form" noValidate onSubmit={form.handleSubmit(save)}>
          <div className="flex min-w-0 flex-col gap-5">
              {failure ? <InlineBanner tone="error">{failure}</InlineBanner> : null}
              {conflict ? (
                <Callout role="alert" title={t("adminUsers.form.conflictTitle")} tone="warning">
                  <div className="flex flex-col items-start gap-3">
                    <span>{t("adminUsers.form.conflictBody")}</span>
                    {conflictRows.length > 0 ? (
                      <table className="w-full table-fixed text-left text-[12.5px]">
                        <thead><tr><th className="pb-1 font-semibold" scope="col">{t("adminUsers.form.conflictField")}</th><th className="pb-1 font-semibold" scope="col">{t("adminUsers.form.conflictSaved")}</th><th className="pb-1 font-semibold" scope="col">{t("adminUsers.form.conflictYours")}</th></tr></thead>
                        <tbody>{conflictRows.map((row) => <tr key={row.label}><th className="wrap-anywhere py-0.5 pr-3 font-medium" scope="row">{row.label}</th><td className="wrap-anywhere pr-3">{row.now}</td><td className="wrap-anywhere">{row.yours}</td></tr>)}</tbody>
                      </table>
                    ) : null}
                    <Button className={DIALOG_BUTTON_CLASS} onClick={loadLatest} shape="default" type="button" variant="outline">{t("adminUsers.form.loadLatest")}</Button>
                  </div>
                </Callout>
              ) : null}
              <div className={editing ? "grid gap-5" : "grid gap-4 sm:grid-cols-2"}>
                <FormField error={errors.fullName ? t("adminUsers.form.fullNameError", FULL_NAME_HINT_RANGE) : undefined} hint={t("adminUsers.form.fullNameHint", FULL_NAME_HINT_RANGE)} htmlFor="user-full-name" label={t("adminUsers.form.fullName")} labelAddon={editing && nameChanged ? <ChangedPill /> : undefined} required>
                  <Input aria-invalid={Boolean(errors.fullName)} id="user-full-name" placeholder={t("adminUsers.form.fullNamePlaceholder")} {...form.register("fullName")} />
                </FormField>
                <FormField error={errors.phone ? t("adminUsers.form.mobileError") : undefined} hint={t("adminUsers.form.mobileHint")} htmlFor="user-mobile" label={t("adminUsers.form.mobile")} labelAddon={editing && phoneChanged ? <ChangedPill /> : undefined}>
                  <Input aria-invalid={Boolean(errors.phone)} id="user-mobile" inputMode="tel" placeholder={t("adminUsers.form.mobilePlaceholder")} type="tel" {...phoneField} onChange={(event) => { event.target.value = normalizeMobile(event.target.value); return phoneField.onChange(event); }} />
                </FormField>
                <FormField
                  error={errors.email ? t("adminUsers.form.emailError") : undefined}
                  hint={editing ? undefined : t(requiresEnterprise ? "adminUsers.form.workEmailHint" : "adminUsers.form.emailHint", { max: EMAIL_MAX_LENGTH })}
                  htmlFor="user-email"
                  label={t("adminUsers.form.email")}
                  labelExtra={editing && onChangeEmail ? <button className="text-[12.5px] font-semibold text-fg-link underline-offset-4 hover:underline" onClick={onChangeEmail} type="button">{t("adminUsers.emailChange.title")}</button> : undefined}
                  required={!editing}
                >
                  {editing ? (
                    <LockedEmailInput id="user-email" tooltip={t("adminUsers.form.emailLocked")} {...form.register("email")} />
                  ) : (
                    <Input aria-invalid={Boolean(errors.email)} id="user-email" placeholder={t("adminUsers.form.emailPlaceholder")} type="email" {...form.register("email")} />
                  )}
                </FormField>
                {editing ? null : (
                  <FormField error={errors.username ? t("adminUsers.form.usernameError", USERNAME_HINT_RANGE) : undefined} hint={t("adminUsers.form.usernameHint", USERNAME_HINT_RANGE)} htmlFor="user-username" label={t("adminUsers.form.username")} required>
                    <Input aria-invalid={Boolean(errors.username)} id="user-username" placeholder={t("adminUsers.form.usernamePlaceholder")} {...form.register("username")} />
                  </FormField>
                )}
              </div>

              {editing ? null : (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[13.5px] font-semibold text-foreground">{t("adminUsers.form.role")} <span className="text-field-error">*</span></legend>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {USER_FORM_ROLES.map((value) => (
                      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[14px] font-semibold text-foreground has-checked:border-2 has-checked:border-primary has-checked:bg-primary/5 has-checked:px-[15px] has-focus-visible:ring-2 has-focus-visible:ring-primary/40" key={value}>
                        <input checked={role === value} className="peer sr-only" name="user-role" onChange={() => { form.setValue("role", value, { shouldDirty: true, shouldValidate: true }); form.setValue("enterpriseId", "", { shouldDirty: true }); }} type="radio" value={value} />
                        <span aria-hidden className="grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-muted-foreground/50 bg-card peer-checked:border-[5px] peer-checked:border-primary" />
                        <span className="min-w-0">{t(`adminUsers.role.${value}`)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {!editing && requiresEnterprise ? (
                <FormField error={errors.enterpriseId ? t("adminUsers.form.enterpriseError") : undefined} hint={t("adminUsers.form.enterpriseHint")} htmlFor="user-enterprise" label={t("adminUsers.form.enterprise")} required>
                  <Popover onOpenChange={setCompanyPickerOpen} open={companyPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button aria-expanded={companyPickerOpen} aria-haspopup="listbox" aria-label={t("adminUsers.form.enterprise")} className="h-11 w-full justify-between rounded-md border border-border bg-card px-3.5 font-normal text-foreground hover:bg-muted/40" id="user-enterprise" type="button" variant="outline">
                        {enterpriseId && selectedEnterpriseName ? (
                          <span className="flex min-w-0 flex-1 items-center gap-2.5">
                            <LogoTile className="size-[26px] rounded-md text-[9px]" name={selectedEnterpriseName} size="sm" />
                            <span className="truncate">{selectedEnterpriseName}</span>
                            <Badge className="ml-auto" variant="success">{t("adminUsers.status.active")}</Badge>
                          </span>
                        ) : <span className="truncate text-muted-foreground">{t("adminUsers.form.enterprisePlaceholder")}</span>}
                        <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[min(26rem,var(--radix-popover-trigger-width))] p-0" side="bottom">
                      <div className="border-b border-border p-2.5">
                        <div className="relative">
                          <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input aria-label={t("adminUsers.form.enterpriseSearch")} className="pl-9" onChange={(event) => { setCompanySearch(event.target.value); setCompanyPage(1); }} placeholder={t("adminUsers.form.enterpriseSearch")} value={companySearch} />
                        </div>
                      </div>
                      {enterprisesQuery.isLoading ? <p className="px-3.5 py-3 text-[13px] text-muted-foreground">{t("state.loading")}</p> : null}
                      {enterprisesQuery.isError ? <p className="px-3.5 py-3 text-[13px] text-destructive" role="alert">{t("adminUsers.form.enterpriseLoadFailed")}</p> : null}
                      {!enterprisesQuery.isLoading && !enterprisesQuery.isError && enterpriseItems.length === 0 ? <p className="px-3.5 py-3 text-[13px] text-muted-foreground">{t("adminUsers.form.noEnterprises")}</p> : null}
                      <div aria-label={t("adminUsers.form.activeEnterprises")} className="max-h-56 overflow-y-auto" role="listbox">
                        {enterpriseItems.map((enterprise) => (
                          <button
                            aria-selected={enterpriseId === enterprise.id}
                            className="flex w-full items-center justify-between gap-3 border-t border-border px-3.5 py-2.5 text-left text-[13.5px] text-foreground first:border-t-0 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                            key={enterprise.id}
                            onClick={() => {
                              form.setValue("enterpriseId", enterprise.id, { shouldDirty: true, shouldValidate: true });
                              setSelectedEnterpriseLabel(enterprise.name);
                              setCompanyPickerOpen(false);
                            }}
                            role="option"
                            type="button"
                          >
                            <span className="flex min-w-0 items-center gap-2.5">
                              <LogoTile className="size-[26px] rounded-md text-[9px]" name={enterprise.name} size="sm" />
                              <span className="truncate">{enterprise.name}</span>
                            </span>
                            {enterprise.id === enterpriseId ? <Check aria-hidden className="size-4 shrink-0 text-primary" /> : null}
                          </button>
                        ))}
                      </div>
                      {(enterprisesQuery.data?.totalPages ?? 0) > 1 ? (
                        <div className="flex items-center justify-between border-t border-border px-2 py-1.5 text-[12px] text-muted-foreground">
                          <Button disabled={companyPage <= 1} onClick={() => setCompanyPage((current) => current - 1)} size="sm" type="button" variant="ghost">{t("pagination.previous")}</Button>
                          <span>{t("pagination.pageN", { page: companyPage })}</span>
                          <Button disabled={companyPage >= (enterprisesQuery.data?.totalPages ?? 1)} onClick={() => setCompanyPage((current) => current + 1)} size="sm" type="button" variant="ghost">{t("pagination.next")}</Button>
                        </div>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                </FormField>
              ) : null}
            </div>
        </form>

        <DialogFooter>
          <div className="flex items-center gap-3">
            <Button className={DIALOG_BUTTON_CLASS} disabled={pending} onClick={requestClose} shape="default" type="button" variant="outline">{t("actions.cancel")}</Button>
            <Button className={DIALOG_BUTTON_CLASS} disabled={pending || (editing ? !changed : (!form.formState.isValid || (requiresEnterprise && !enterpriseId)))} form="user-form" shape="default" type="submit">
                {editing ? null : <Send aria-hidden className="size-4" />}
                {pending ? t("adminUsers.form.saving") : t(editing ? "adminUsers.form.save" : "adminUsers.form.create")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      {undelivered ? <InvitationNotDeliveredDialog onOpenChange={(next) => !next && setUndelivered(null)} open user={undelivered} /> : null}
      <ActionConfirmDialog
        action={t("adminUsers.form.discard")}
        cancelLabel={t("adminUsers.form.keepEditing")}
        description={t(editing ? "adminUsers.form.discardEditDescription" : "adminUsers.form.cancelChangesDescription")}
        icon={TriangleAlert}
        onConfirm={() => { setConfirmDiscard(false); reset(); }}
        onOpenChange={setConfirmDiscard}
        open={confirmDiscard}
        title={t(editing ? "adminUsers.form.discardEditTitle" : "adminUsers.form.cancelChangesTitle")}
        variant="destructive-solid"
      />
    </>
  );
}
