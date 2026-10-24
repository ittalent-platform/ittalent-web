import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Camera,
  Check,
  LockKeyhole,
  Pencil,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  useBeforeUnload,
  useBlocker,
  useLocation,
  useNavigate,
} from "react-router";
import { z } from "zod";

import type { MyProfile, UpdateMyProfile } from "@/api/generated/types.gen";
import {
  HTTP_CONFLICT,
  HTTP_FORBIDDEN,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
} from "@/api/http-status";
import { requestStatus } from "@/api/request-error";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { PageHeader } from "@/components/common/admin-page-header";
import { DetailRow } from "@/components/common/detail-row";
import { ErrorState } from "@/components/common/error-state";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { PersonAvatar } from "@/components/common/person-avatar";
import { SectionCard } from "@/components/common/section-card";
import { useToast } from "@/components/toast/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AvatarUploadDialog } from "./profile-avatar-dialog";
import { ChangePasswordPanel } from "./profile-password-panel";
import {
  CANDIDATE_ROLE,
  PROFILE_ACTIVE_STATUS,
  PROFILE_BLOCKED_STATUSES,
  PROFILE_NAME_MAX,
  PROFILE_NAME_MIN,
  PROFILE_PHONE_PATTERN,
  PROFILE_STATUS_LABEL_KEYS,
  PROFILE_STATUS_VARIANTS,
} from "./profile.constants";
import {
  useMyProfile,
  useUpdateMyProfile,
  useUploadMyAvatar,
} from "./profile.queries";

type DetailsForm = { fullName: string; phone: string };
type SaveError = "conflict" | "generic" | null;
type FullMyProfile = Extract<MyProfile, { access: "full" }>;

function normalizePhone(value: string | null | undefined): string | null {
  const normalized = (value ?? "").replace(/[\s().-]/g, "");
  return normalized || null;
}

function buildUpdatePayload(
  profile: FullMyProfile,
  values: DetailsForm,
): UpdateMyProfile | null {
  if (typeof profile.version !== "number") return null;
  const fullName = values.fullName.trim();
  const phone = normalizePhone(values.phone);
  const payload: UpdateMyProfile = { expectedVersion: profile.version };
  let changed = false;

  if (fullName !== (profile.fullName ?? "").trim()) {
    payload.fullName = fullName;
    changed = true;
  }
  if (phone !== normalizePhone(profile.phone)) {
    payload.phone = phone;
    changed = true;
  }

  return changed ? payload : null;
}

function hasBaseProjection(profile: MyProfile): boolean {
  return (
    (profile.access === "basic" || profile.access === "full") &&
    typeof profile.id === "string" &&
    typeof profile.email === "string" &&
    typeof profile.username === "string" &&
    (typeof profile.fullName === "string" || profile.fullName === null) &&
    (typeof profile.avatarUrl === "string" || profile.avatarUrl === null) &&
    typeof profile.role === "string" &&
    typeof profile.status === "string" &&
    typeof profile.emailVerified === "boolean"
  );
}

function hasValidProjection(profile: MyProfile): boolean {
  if (!hasBaseProjection(profile)) return false;
  if (profile.access === "basic") return true;
  return (
    (typeof profile.phone === "string" || profile.phone === null) &&
    typeof profile.hasPassword === "boolean" &&
    (typeof profile.enterpriseId === "string" || profile.enterpriseId === null) &&
    (typeof profile.enterpriseName === "string" || profile.enterpriseName === null) &&
    typeof profile.version === "number"
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useMyProfile();
  const refetchProfile = profile.refetch;
  const passwordView = location.pathname.endsWith("/password");
  const profilePath = location.pathname.replace(/\/password$/, "");

  if (profile.isPending) return <ProfileSkeleton />;
  if (profile.isError) {
    return (
      <ProfileLoadError
        error={profile.error}
        onRetry={() => void profile.refetch()}
        onSignIn={() => navigate("/login")}
      />
    );
  }
  if (!profile.data) {
    return (
      <ProfileStatePage>
        <ErrorState
          description={t("myProfile.missingDescription")}
          onRetry={() => void refetchProfile()}
          title={t("myProfile.missingTitle")}
        />
      </ProfileStatePage>
    );
  }
  if (!hasValidProjection(profile.data)) {
    return (
      <ProfileStatePage>
        <ErrorState
          description={t("myProfile.projectionFailedDescription")}
          title={t("myProfile.projectionFailed")}
        />
      </ProfileStatePage>
    );
  }

  const blocked = PROFILE_BLOCKED_STATUSES.includes(
    profile.data.status as (typeof PROFILE_BLOCKED_STATUSES)[number],
  );
  if (blocked) {
    return (
      <ProfileStatePage>
        <ErrorState
          description={t("myProfile.blockedDescription")}
          title={t("myProfile.blockedTitle")}
        />
      </ProfileStatePage>
    );
  }

  const basicRead = profile.data.access === "basic";
  const isFullProfile = profile.data.access === "full";
  const canMutate =
    isFullProfile && profile.data.status === PROFILE_ACTIVE_STATUS;
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

      {basicRead ? (
        <InlineBanner tone="warning">
          {t("myProfile.unverifiedBasicRead")}
        </InlineBanner>
      ) : profile.data.status !== PROFILE_ACTIVE_STATUS ? (
        <InlineBanner tone="warning">
          {t("myProfile.readOnlyAccount")}
        </InlineBanner>
      ) : null}

      {passwordView ? (
        profile.data.access === "full" && canMutate ? (
          <ChangePasswordPanel
            hasPassword={profile.data.hasPassword}
            onCancel={() => navigate(profilePath)}
          />
        ) : (
          <ErrorState
            description={t("myProfile.actionsUnavailableDescription")}
            secondaryAction={{
              label: t("myProfile.backToProfile"),
              onClick: () => navigate(profilePath),
            }}
            title={t("myProfile.actionsUnavailable")}
          />
        )
      ) : (
        profile.data.access === "full" ? (
          <ProfileDetails
            canMutate={canMutate}
            onOpenPassword={() => navigate("password")}
            onReload={async () => {
              await profile.refetch();
            }}
            profile={profile.data}
          />
        ) : (
          <BasicProfileDetails profile={profile.data} />
        )
      )}
    </div>
  );
}

function ProfileStatePage({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-[1028px] flex-col gap-5">
      <PageHeader
        description={t("myProfile.subtitleCandidate")}
        title={t("myProfile.title")}
      />
      {children}
    </div>
  );
}

function ProfileLoadError({
  error,
  onRetry,
  onSignIn,
}: {
  error: unknown;
  onRetry: () => void;
  onSignIn: () => void;
}) {
  const { t } = useTranslation();
  const status = requestStatus(error);

  if (status === HTTP_UNAUTHORIZED) {
    return (
      <ProfileStatePage>
        <ErrorState
          description={t("myProfile.unauthenticatedDescription")}
          secondaryAction={{ label: t("myProfile.signIn"), onClick: onSignIn }}
          title={t("myProfile.unauthenticatedTitle")}
        />
      </ProfileStatePage>
    );
  }
  if (status === HTTP_FORBIDDEN) {
    return (
      <ProfileStatePage>
        <ErrorState
          description={t("myProfile.accessDeniedDescription")}
          title={t("myProfile.accessDeniedTitle")}
        />
      </ProfileStatePage>
    );
  }
  if (status === HTTP_NOT_FOUND) {
    return (
      <ProfileStatePage>
        <ErrorState
          description={t("myProfile.missingDescription")}
          onRetry={onRetry}
          title={t("myProfile.missingTitle")}
        />
      </ProfileStatePage>
    );
  }
  return (
    <ProfileStatePage>
      <ErrorState
        description={t("myProfile.loadFailedDescription")}
        onRetry={onRetry}
        title={t("myProfile.loadFailed")}
      />
    </ProfileStatePage>
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
      <h1 className="sr-only">{t("myProfile.title")}</h1>
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
  canMutate,
  onOpenPassword,
  onReload,
  profile,
}: {
  canMutate: boolean;
  onOpenPassword: () => void;
  onReload: () => Promise<void>;
  profile: FullMyProfile;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<SaveError>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
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
  const values = useWatch({ control: form.control });
  const payload = buildUpdatePayload(profile, {
    fullName: values.fullName ?? "",
    phone: values.phone ?? "",
  });
  const changedFieldCount = payload
    ? Number(payload.fullName !== undefined) + Number(payload.phone !== undefined)
    : 0;
  const hasChanges = changedFieldCount > 0;
  const blocker = useBlocker(editing && hasChanges);

  useBeforeUnload((event) => {
    if (!editing || !hasChanges) return;
    event.preventDefault();
  });

  useEffect(() => {
    if (!hasChanges) {
      form.reset({
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [form, hasChanges, profile.fullName, profile.phone]);

  const displayName = profile.fullName?.trim() || t("myProfile.notProvided");
  const statusKey =
    PROFILE_STATUS_LABEL_KEYS[
      profile.status as keyof typeof PROFILE_STATUS_LABEL_KEYS
    ];
  const statusVariant =
    PROFILE_STATUS_VARIANTS[
      profile.status as keyof typeof PROFILE_STATUS_VARIANTS
    ] ?? "neutral";
  const canEdit = canMutate && typeof profile.version === "number";
  const companyName =
    profile.enterpriseId && profile.enterpriseName?.trim()
      ? profile.enterpriseName.trim()
      : null;

  function resetEditing() {
    form.reset({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
    });
    setSaveError(null);
    setEditing(false);
  }

  function requestCancel() {
    if (hasChanges) setCancelDialogOpen(true);
    else resetEditing();
  }

  async function save(valuesToSave: DetailsForm) {
    const nextPayload = buildUpdatePayload(profile, valuesToSave);
    if (!nextPayload) return;
    setSaveError(null);
    try {
      const updated = await update.mutateAsync(nextPayload);
      if (updated.access !== "full") {
        throw new Error("Profile update returned an insufficient projection.");
      }
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
        requestStatus(error) === HTTP_CONFLICT ? "conflict" : "generic",
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
              name={profile.fullName ?? profile.username}
              src={profile.avatarUrl}
            />
            {canMutate ? (
              <button
                aria-label={t("myProfile.changeAvatar")}
                className="absolute -bottom-0.5 -right-0.5 grid size-8 place-items-center rounded-full border-[3px] border-card bg-foreground text-card transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => setAvatarDialogOpen(true)}
                type="button"
              >
                <Camera aria-hidden className="size-3.5" />
              </button>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="itt-display truncate text-2xl font-semibold">
              {displayName}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-muted-foreground">
              <span className="wrap-anywhere">{profile.email}</span>
              <VerificationBadge verified={profile.emailVerified} />
            </div>
            {canMutate ? (
              <p className="text-[12.5px] text-muted-foreground">
                {t("myProfile.avatarHint")}
              </p>
            ) : null}
          </div>
          {!editing && canEdit ? (
            <Button
              onClick={() => setEditing(true)}
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

      {canMutate && typeof profile.version !== "number" ? (
        <InlineBanner tone="error">{t("myProfile.versionUnavailable")}</InlineBanner>
      ) : null}

      {editing ? (
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(save)}>
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
                messageId="profile-name-message"
                required
              >
                <Input
                  aria-invalid={Boolean(form.formState.errors.fullName)}
                  aria-describedby="profile-name-message"
                  id="profile-name"
                  {...form.register("fullName")}
                />
              </FormField>
              <FormField
                error={form.formState.errors.phone?.message}
                hint={t("myProfile.phoneHint")}
                htmlFor="profile-phone"
                label={t("myProfile.phone")}
                messageId="profile-phone-message"
              >
                <Input
                  aria-invalid={Boolean(form.formState.errors.phone)}
                  aria-describedby="profile-phone-message"
                  id="profile-phone"
                  inputMode="tel"
                  placeholder={t("myProfile.phonePlaceholder")}
                  {...form.register("phone")}
                />
              </FormField>
            </div>
            {saveError === "conflict" ? (
              <InlineBanner
                action={{
                  label: t("myProfile.reloadProfile"),
                  onClick: () => {
                    void onReload().then(resetEditing);
                  },
                }}
                tone="error"
              >
                {t("myProfile.conflict")}
              </InlineBanner>
            ) : saveError === "generic" ? (
              <InlineErrorAlert>{t("myProfile.saveFailed")}</InlineErrorAlert>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-[18px]">
              {hasChanges ? (
                <p className="mr-auto text-[12.5px] text-muted-foreground">
                  {t("myProfile.unsavedChanges", { count: changedFieldCount })}
                </p>
              ) : null}
              <Button
                disabled={update.isPending}
                onClick={requestCancel}
                size="xl"
                type="button"
                variant="outline"
              >
                {t("myProfile.cancel")}
              </Button>
              <Button
                disabled={update.isPending || !hasChanges}
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
              value={profile.fullName?.trim() || t("myProfile.notProvided")}
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
        actions={<LockKeyhole aria-hidden className="size-4 text-muted-foreground" />}
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
                {statusKey ? t(statusKey) : t("myProfile.status.unknown")}
              </Badge>
            }
          />
          {companyName ? (
            <DetailRow
              className="sm:grid-cols-[180px_minmax(0,1fr)]"
              label={t("myProfile.companyMembership")}
              layout="grid"
              value={companyName}
            />
          ) : null}
        </dl>
        {canMutate ? (
          <div className="flex justify-end border-t border-border/60 pt-[18px]">
            <Button
              onClick={onOpenPassword}
              size="xl"
              type="button"
              variant="outline"
            >
              <LockKeyhole aria-hidden className="size-4" />
              {t("myProfile.changePassword")}
            </Button>
          </div>
        ) : null}
      </SectionCard>

      <ActionConfirmDialog
        action={t("myProfile.discard")}
        cancelLabel={t("myProfile.keepEditing")}
        description={t("myProfile.discardDescription")}
        icon={TriangleAlert}
        onConfirm={() => {
          setCancelDialogOpen(false);
          resetEditing();
        }}
        onOpenChange={setCancelDialogOpen}
        open={cancelDialogOpen}
        title={t("myProfile.discardTitle")}
        variant="destructive-solid"
      />
      <ActionConfirmDialog
        action={t("myProfile.discard")}
        cancelLabel={t("myProfile.keepEditing")}
        description={t("myProfile.discardNavigationDescription")}
        icon={TriangleAlert}
        onConfirm={() => {
          resetEditing();
          if (blocker.state === "blocked") blocker.proceed();
        }}
        onOpenChange={(open) => {
          if (!open && blocker.state === "blocked") blocker.reset();
        }}
        open={blocker.state === "blocked"}
        title={t("myProfile.discardTitle")}
        variant="destructive-solid"
      />
      <AvatarUploadDialog
        currentAvatarUrl={profile.avatarUrl}
        name={profile.fullName ?? profile.username}
        onOpenChange={setAvatarDialogOpen}
        onUpload={saveAvatar}
        open={avatarDialogOpen}
      />
    </div>
  );
}

function BasicProfileDetails({
  profile,
}: {
  profile: Extract<MyProfile, { access: "basic" }>;
}) {
  const { t } = useTranslation();
  const statusKey =
    PROFILE_STATUS_LABEL_KEYS[
      profile.status as keyof typeof PROFILE_STATUS_LABEL_KEYS
    ];
  const statusVariant =
    PROFILE_STATUS_VARIANTS[
      profile.status as keyof typeof PROFILE_STATUS_VARIANTS
    ] ?? "neutral";

  return (
    <div className="flex flex-col gap-5">
      <SectionCard className="gap-[18px] p-6">
        <div className="flex flex-wrap items-center gap-[22px]">
          <PersonAvatar
            className="size-[88px] itt-display text-[26px]"
            name={profile.fullName ?? profile.username}
            src={profile.avatarUrl}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="itt-display truncate text-2xl font-semibold">
              {profile.fullName?.trim() || t("myProfile.notProvided")}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-muted-foreground">
              <span className="wrap-anywhere">{profile.email}</span>
              <VerificationBadge verified={profile.emailVerified} />
            </div>
          </div>
        </div>
      </SectionCard>
      <SectionCard
        actions={<LockKeyhole aria-hidden className="size-4 text-muted-foreground" />}
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
            value={<span className="flex flex-wrap items-center gap-2"><span>{profile.email}</span><VerificationBadge verified={profile.emailVerified} /></span>}
          />
          <DetailRow className="sm:grid-cols-[180px_minmax(0,1fr)]" label={t("myProfile.roleLabel")} layout="grid" value={roleLabel(profile, t)} />
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.accountStatus")}
            layout="grid"
            value={<Badge variant={statusVariant}>{statusKey ? t(statusKey) : t("myProfile.status.unknown")}</Badge>}
          />
        </dl>
      </SectionCard>
    </div>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge variant={verified ? "success" : "warning"}>
      {verified ? <Check aria-hidden className="size-3" strokeWidth={3} /> : null}
      {t(verified ? "myProfile.verified" : "myProfile.notVerified")}
    </Badge>
  );
}

function roleLabel(
  profile: MyProfile,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (profile.role === "admin") return t("myProfile.roleAdmin");
  if (profile.role === "recruiter") return t("myProfile.roleRecruiter");
  if (profile.role === "enterprise_admin") {
    return t("myProfile.roleEnterpriseAdmin");
  }
  if (profile.role === CANDIDATE_ROLE) return t("myProfile.roleCandidate");
  return t("myProfile.roleUnknown");
}
