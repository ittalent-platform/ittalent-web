import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Camera,
  Check,
  ImageUp,
  LockKeyhole,
  Monitor,
  Pencil,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { z } from "zod";

import type { MyProfile } from "@/api/generated/types.gen";
import { HTTP_CONFLICT, HTTP_TOO_MANY_REQUESTS } from "@/api/http-status";
import { requestErrorMessage, requestStatus } from "@/api/request-error";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { PageHeader } from "@/components/common/admin-page-header";
import { DetailRow } from "@/components/common/detail-row";
import { ErrorState } from "@/components/common/error-state";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { PasswordField } from "@/components/common/password-field";
import { PersonAvatar } from "@/components/common/person-avatar";
import { SectionCard } from "@/components/common/section-card";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { userDisplayId } from "@/lib/display-id";
import { formatDate } from "@/lib/format";
import { PASSWORD_RULES } from "@/lib/password-rules";
import { strongPasswordSchema } from "@/lib/password-schema";
import { cn } from "@/lib/utils";

import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  PROFILE_NAME_MAX,
  PROFILE_NAME_MIN,
  PROFILE_PHONE_PATTERN,
  PROFILE_STATUS_LABEL_KEYS,
  PROFILE_STATUS_VARIANTS,
} from "./profile.constants";
import {
  useChangeMyPassword,
  useMyProfile,
  useUpdateMyProfile,
  useUploadMyAvatar,
} from "./profile.queries";

type DetailsForm = { fullName: string; phone: string };
type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
type PendingNavigation = "cancel" | "password" | null;

export function ProfilePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useMyProfile();
  const passwordView = location.pathname.endsWith("/password");
  const profilePath = location.pathname.replace(/\/password$/, "");

  if (profile.isPending) return <ProfileSkeleton />;
  if (profile.isError)
    return (
      <ErrorState
        description={t("myProfile.loadFailedDescription")}
        onRetry={() => void profile.refetch()}
        title={t("myProfile.loadFailed")}
      />
    );
  if (!profile.data)
    return (
      <ErrorState
        description={t("myProfile.empty")}
        title={t("myProfile.title")}
      />
    );

  const title = passwordView ? t("myProfile.password") : t("myProfile.title");
  const subtitle = passwordView
    ? t("myProfile.passwordSubtitle")
    : profileSubtitle(profile.data, t);

  return (
    <div className="mx-auto flex w-full max-w-[1028px] flex-col gap-5">
      <PageHeader
        actions={
          passwordView ? (
            <Button
              onClick={() => navigate(profilePath)}
              size="lg"
              type="button"
              variant="ghost"
            >
              <ArrowLeft aria-hidden className="size-4" />
              {t("myProfile.backToProfile")}
            </Button>
          ) : (
          <Button
            className="text-muted-foreground"
            disabled={profile.isFetching}
            onClick={() => void profile.refetch()}
            shape="pill"
            size="lg"
            type="button"
            variant="ghost"
          >
            <RefreshCw
              aria-hidden
              className={cn("size-4", profile.isFetching && "animate-spin")}
            />
            {t("myProfile.refresh")}
          </Button>
          )
        }
        description={subtitle}
        title={title}
      />

      {passwordView ? (
        <ChangePassword
          hasPassword={profile.data.hasPassword}
          onCancel={() => navigate(profilePath)}
        />
      ) : (
        <ProfileDetails
          onOpenPassword={() => navigate("password")}
          profile={profile.data}
        />
      )}
    </div>
  );
}

function profileSubtitle(
  profile: MyProfile,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (profile.role === "admin") return t("myProfile.subtitleAdmin");
  if (profile.role === "recruiter" || profile.role === "enterprise_admin") {
    return t("myProfile.subtitleRecruiter");
  }
  return t("myProfile.subtitleCandidate");
}

function ProfileSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="mx-auto flex w-full max-w-[1028px] flex-col gap-5"
      role="status"
    >
      <span className="sr-only">{t("myProfile.loading")}</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="surface-card flex items-center gap-5 p-6">
        <Skeleton className="size-[88px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function ProfileDetails({
  onOpenPassword,
  profile,
}: {
  onOpenPassword: () => void;
  profile: MyProfile;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation>(null);
  const update = useUpdateMyProfile();
  const upload = useUploadMyAvatar();
  const schema = z.object({
    fullName: z
      .string()
      .trim()
      .min(PROFILE_NAME_MIN, t("myProfile.nameInvalid"))
      .max(PROFILE_NAME_MAX, t("myProfile.nameInvalid")),
    phone: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          PROFILE_PHONE_PATTERN.test(value.replace(/[\s().-]/g, "")),
        t("myProfile.phoneInvalid"),
      ),
  });
  const form = useForm<DetailsForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
    },
  });

  useEffect(() => {
    if (!form.formState.isDirty)
      form.reset({
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
      });
  }, [profile.fullName, profile.phone, form]);
  const displayName = profile.fullName || profile.username;
  const statusKey =
    PROFILE_STATUS_LABEL_KEYS[
      profile.status as keyof typeof PROFILE_STATUS_LABEL_KEYS
    ];
  const statusVariant =
    PROFILE_STATUS_VARIANTS[
      profile.status as keyof typeof PROFILE_STATUS_VARIANTS
    ] ?? "neutral";

  function resetEditing() {
    form.reset({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
    });
    setSaveError(null);
    setEditing(false);
  }

  function requestNavigation(destination: Exclude<PendingNavigation, null>) {
    if (form.formState.isDirty) {
      setPendingNavigation(destination);
      return;
    }
    if (destination === "cancel") resetEditing();
    else onOpenPassword();
  }

  function discardChanges() {
    const destination = pendingNavigation;
    setPendingNavigation(null);
    resetEditing();
    if (destination === "password") onOpenPassword();
  }

  async function save(values: DetailsForm) {
    setSaveError(null);
    try {
      const updated = await update.mutateAsync({
        expectedVersion: profile.version,
        fullName: values.fullName.trim(),
        phone: values.phone.replace(/[\s().-]/g, "") || null,
      });
      form.reset({
        fullName: updated.fullName ?? "",
        phone: updated.phone ?? "",
      });
      setEditing(false);
      showToast({
        message: t("myProfile.saved"),
        title: t("myProfile.saved"),
        tone: "success",
      });
    } catch (error) {
      setSaveError(
        requestStatus(error) === HTTP_CONFLICT
          ? t("myProfile.conflict")
          : t("myProfile.saveFailed"),
      );
    }
  }

  async function saveAvatar(file: File) {
    try {
      await upload.mutateAsync(file);
      showToast({
        message: t("myProfile.avatarSaved"),
        title: t("myProfile.avatarSaved"),
        tone: "success",
      });
    } catch {
      throw new Error(t("myProfile.avatarFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard className="gap-[18px] p-6">
        <div className="flex flex-wrap items-center gap-[22px]">
          <div className="relative shrink-0">
            <PersonAvatar
              className="size-[88px] itt-display text-[26px]"
              name={displayName}
              src={profile.avatarUrl}
            />
            <button
              aria-label={t("myProfile.changeAvatar")}
              className="absolute -bottom-0.5 -right-0.5 grid size-8 place-items-center rounded-full border-[3px] border-card bg-foreground text-card transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => setAvatarDialogOpen(true)}
              type="button"
            >
              <Camera aria-hidden className="size-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="itt-display truncate text-2xl font-semibold">
              {displayName}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-muted-foreground">
              <span className="wrap-anywhere">{profile.email}</span>
              <VerificationBadge verified={profile.emailVerified} />
            </div>
            <p className="text-[12.5px] text-muted-foreground">
              {t("myProfile.avatarHint")}
            </p>
          </div>
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              shape="pill"
              size="xl"
              type="button"
              variant="outline"
            >
              <Pencil aria-hidden className="size-4" />
              {t("myProfile.editProfile")}
            </Button>
          ) : null}
        </div>
      </SectionCard>

      {editing ? (
        <form
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(save)}
        >
          <SectionCard
            className="gap-[18px] p-6"
            description={t("myProfile.personalDescription")}
            title={t("myProfile.details")}
            titleSize="lg"
          >
            <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-4">
              <FormField
                error={form.formState.errors.fullName?.message}
                hint={t("myProfile.nameHint")}
                htmlFor="profile-name"
                label={t("myProfile.fullName")}
                required
              >
                <Input
                  aria-invalid={Boolean(form.formState.errors.fullName)}
                  id="profile-name"
                  {...form.register("fullName")}
                />
              </FormField>
              <FormField
                error={form.formState.errors.phone?.message}
                hint={t("myProfile.phoneHint")}
                htmlFor="profile-phone"
                label={t("myProfile.phone")}
              >
                <Input
                  aria-invalid={Boolean(form.formState.errors.phone)}
                  id="profile-phone"
                  inputMode="tel"
                  placeholder={t("myProfile.phonePlaceholder")}
                  {...form.register("phone")}
                />
              </FormField>
            </div>
            {saveError ? (
              <InlineErrorAlert>{saveError}</InlineErrorAlert>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-[18px]">
              {form.formState.isDirty ? (
                <p className="mr-auto text-[12.5px] text-muted-foreground">
                  {t("myProfile.unsavedChanges", { count: 1 })}
                </p>
              ) : null}
              <Button
                disabled={update.isPending}
                onClick={() => requestNavigation("cancel")}
                shape="pill"
                size="xl"
                type="button"
                variant="outline"
              >
                {t("myProfile.cancel")}
              </Button>
              <Button
                disabled={update.isPending || !form.formState.isDirty}
                shape="pill"
                size="xl"
                type="submit"
              >
                {update.isPending ? t("myProfile.saving") : t("myProfile.save")}
              </Button>
            </div>
          </SectionCard>
        </form>
      ) : (
        <SectionCard
          className="gap-[18px] p-6"
          description={t("myProfile.personalDescription")}
          title={t("myProfile.details")}
          titleSize="lg"
        >
          <dl className="m-0">
            <DetailRow
              className="sm:grid-cols-[180px_minmax(0,1fr)]"
              label={t("myProfile.fullName")}
              layout="grid"
              value={displayName}
            />
            <DetailRow
              className="sm:grid-cols-[180px_minmax(0,1fr)]"
              label={t("myProfile.phone")}
              layout="grid"
              value={profile.phone || t("myProfile.notProvided")}
            />
          </dl>
        </SectionCard>
      )}

      <SectionCard
        actions={
          <LockKeyhole aria-hidden className="size-4 text-muted-foreground" />
        }
        className="gap-[18px] p-6"
        description={t("myProfile.accountDescription")}
        title={t("myProfile.account")}
        titleSize="lg"
      >
        <dl className="m-0">
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.emailLabel")}
            layout="grid"
            value={
              <span className="flex flex-wrap items-center gap-2">
                <span>{profile.email}</span>
                <VerificationBadge verified={profile.emailVerified} />
              </span>
            }
          />
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.roleLabel")}
            layout="grid"
            value={roleLabel(profile, t)}
          />
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.accountStatus")}
            layout="grid"
            value={
              <Badge variant={statusVariant}>
                {statusKey ? t(statusKey) : profile.status}
              </Badge>
            }
          />
          {profile.createdAt ? (
            <DetailRow
              className="sm:grid-cols-[180px_minmax(0,1fr)]"
              label={t("myProfile.memberSince")}
              layout="grid"
              value={formatDate(profile.createdAt)}
            />
          ) : null}
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.accountId")}
            layout="grid"
            value={<span className="itt-mono text-[12.5px]">{userDisplayId(profile.id)}</span>}
          />
        </dl>
        <div className="flex justify-end border-t border-border/60 pt-[18px]">
          <Button
            onClick={() => requestNavigation("password")}
            shape="pill"
            size="xl"
            type="button"
            variant="outline"
          >
            <LockKeyhole aria-hidden className="size-4" />
            {t("myProfile.changePassword")}
          </Button>
        </div>
      </SectionCard>
      <ActionConfirmDialog
        action={t("myProfile.discard")}
        cancelLabel={t("myProfile.keepEditing")}
        description={t("myProfile.discardDescription")}
        icon={TriangleAlert}
        onConfirm={discardChanges}
        onOpenChange={(open) => !open && setPendingNavigation(null)}
        open={pendingNavigation !== null}
        title={t("myProfile.discardTitle")}
        variant="destructive-solid"
      />
      <AvatarUploadDialog
        onOpenChange={setAvatarDialogOpen}
        onUpload={saveAvatar}
        open={avatarDialogOpen}
      />
    </div>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge variant={verified ? "success" : "warning"}>
      {verified ? (
        <Check aria-hidden className="size-3" strokeWidth={3} />
      ) : null}
      {t(verified ? "myProfile.verified" : "myProfile.notVerified")}
    </Badge>
  );
}

function roleLabel(
  profile: MyProfile,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (profile.role === "admin") return t("myProfile.roleAdmin");
  if (profile.role === "recruiter" || profile.role === "enterprise_admin") {
    return t("myProfile.roleHr", {
      company: profile.enterpriseName || t("myProfile.companyNotAssigned"),
    });
  }
  return t("myProfile.roleCandidate");
}

function AvatarUploadDialog({
  onOpenChange,
  onUpload,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => Promise<void>;
  open: boolean;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function clearSelection() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
    if (input.current) input.current.value = "";
  }

  function selectFile(candidate?: File) {
    clearSelection();
    if (!candidate) return;
    if (candidate.size === 0) {
      setError(t("myProfile.avatarEmpty"));
      return;
    }
    if (!AVATAR_TYPES.includes(candidate.type as (typeof AVATAR_TYPES)[number])) {
      setError(t("myProfile.avatarType"));
      return;
    }
    if (candidate.size > AVATAR_MAX_BYTES) {
      setError(t("myProfile.avatarSize"));
      return;
    }
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  }

  async function save() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      clearSelection();
      onOpenChange(false);
    } catch (failure) {
      setError(requestErrorMessage(failure, t("myProfile.avatarFailed")));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!uploading) {
          if (!next) clearSelection();
          onOpenChange(next);
        }
      }}
      open={open}
    >
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("myProfile.uploadAvatar")}</DialogTitle>
          <DialogDescription>{t("myProfile.avatarHint")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-[26px] py-5 sm:flex-row sm:items-center">
          <input
            ref={input}
            accept="image/jpeg,image/png,image/webp"
            aria-label={t("myProfile.chooseAvatar")}
            className="sr-only"
            onChange={(event) => selectFile(event.target.files?.[0])}
            type="file"
          />
          <button
            className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-dashed bg-canvas px-4 text-center text-[13px] text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => input.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              selectFile(event.dataTransfer.files[0]);
            }}
            type="button"
          >
            <ImageUp aria-hidden className="size-5" />
            <span className="font-semibold text-foreground">
              {t("myProfile.dropAvatar")}
            </span>
            <span>{t("myProfile.avatarHint")}</span>
          </button>
          <div className="flex w-full flex-col items-center gap-2 sm:w-[160px]">
            <div className="grid size-[128px] place-items-center overflow-hidden rounded-full border border-border bg-muted">
              {preview ? (
                <img
                  alt={t("myProfile.avatarPreview")}
                  className="size-full object-cover"
                  src={preview}
                />
              ) : (
                <Camera aria-hidden className="size-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-center text-[12.5px] text-muted-foreground">
              {t("myProfile.avatarPreview")}
            </p>
          </div>
        </div>
        {error ? (
          <div className="px-[26px] pb-5" role="alert">
            <InlineErrorAlert>{error}</InlineErrorAlert>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            disabled={uploading}
            onClick={() => {
              clearSelection();
              onOpenChange(false);
            }}
            size="lg"
            type="button"
            variant="outline"
          >
            {t("myProfile.cancel")}
          </Button>
          <Button disabled={!file || uploading} onClick={() => void save()} size="lg" type="button">
            {uploading ? t("myProfile.uploading") : t("myProfile.saveAvatar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangePassword({
  hasPassword,
  onCancel,
}: {
  hasPassword: boolean;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const change = useChangeMyPassword();
  const schema = z
    .object({
      currentPassword: z.string().min(1, t("myProfile.currentRequired")),
      newPassword: strongPasswordSchema,
      confirmPassword: z.string().min(1, t("myProfile.confirmRequired")),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      path: ["confirmPassword"],
      message: t("myProfile.passwordMismatch"),
    })
    .refine((value) => value.currentPassword !== value.newPassword, {
      path: ["newPassword"],
      message: t("myProfile.passwordSame"),
    });
  const form = useForm<PasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });
  const [currentPassword, newPassword] = useWatch({
    control: form.control,
    name: ["currentPassword", "newPassword"],
  });
  const passwordRules: Array<{ key: string; met: boolean; text: string }> = PASSWORD_RULES.map((rule) => ({
    key: rule.id,
    met: rule.test(newPassword ?? ""),
    text: t(`myProfile.passwordRules.${rule.id}`),
  }));
  passwordRules.push({
    key: "different",
    met: Boolean(newPassword && currentPassword !== newPassword),
    text: t("myProfile.passwordRules.different"),
  });

  if (!hasPassword)
    return (
      <SectionCard className="p-6">
        <InlineBanner tone="info">{t("myProfile.socialAccount")}</InlineBanner>
        <div className="flex justify-end">
          <Button onClick={onCancel} size="xl" type="button" variant="outline">
            {t("myProfile.backToProfile")}
          </Button>
        </div>
      </SectionCard>
    );

  async function save(values: PasswordForm) {
    setError(null);
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      showToast({
        message: t("myProfile.passwordChanged"),
        title: t("myProfile.passwordChanged"),
        tone: "success",
      });
      onCancel();
    } catch (failure) {
      setError(
        requestStatus(failure) === HTTP_TOO_MANY_REQUESTS
          ? t("myProfile.passwordRateLimited")
          : t("myProfile.passwordIncorrect"),
      );
    }
  }

  return (
    <form onSubmit={form.handleSubmit(save)}>
      <SectionCard className="gap-[18px] p-6">
        <div className="flex max-w-[560px] flex-col gap-[18px]">
          <PasswordField
            error={form.formState.errors.currentPassword?.message}
            id="current-password"
            label={t("myProfile.currentPassword")}
            registration={form.register("currentPassword")}
            required
          />
          <div className="space-y-2.5">
            <PasswordField
              error={form.formState.errors.newPassword?.message}
              id="new-password"
              label={t("myProfile.newPassword")}
              registration={form.register("newPassword")}
              required
            />
            <ul
              aria-label={t("myProfile.passwordRules.label")}
              className="grid list-none gap-2 p-0 sm:grid-cols-2 sm:gap-x-4"
            >
              {passwordRules.map((rule) => (
                <li
                  className={cn(
                    "flex items-center gap-2 text-[13px]",
                    rule.met
                      ? "text-(--status-success-fg)"
                      : "text-muted-foreground",
                  )}
                  key={rule.key}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full",
                      rule.met
                        ? "bg-(--status-success-fg) text-card"
                        : "border border-border-dashed",
                    )}
                  >
                    {rule.met ? (
                      <Check
                        aria-hidden
                        className="size-2.5"
                        strokeWidth={3.5}
                      />
                    ) : null}
                  </span>
                  {rule.text}
                </li>
              ))}
            </ul>
          </div>
          <PasswordField
            error={form.formState.errors.confirmPassword?.message}
            id="confirm-password"
            label={t("myProfile.confirmPassword")}
            registration={form.register("confirmPassword")}
            required
          />
        </div>
        {error ? <InlineErrorAlert>{error}</InlineErrorAlert> : null}
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-[18px]">
          <p className="flex min-w-0 flex-1 items-start gap-2 text-[13px] text-muted-foreground">
            <Monitor aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{t("myProfile.passwordSessionNote")}</span>
          </p>
          <Button
            disabled={change.isPending}
            onClick={onCancel}
            shape="pill"
            size="xl"
            type="button"
            variant="outline"
          >
            {t("myProfile.cancel")}
          </Button>
          <Button
            disabled={change.isPending}
            shape="pill"
            size="xl"
            type="submit"
          >
            {change.isPending
              ? t("myProfile.changingPassword")
              : t("myProfile.changePassword")}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}
