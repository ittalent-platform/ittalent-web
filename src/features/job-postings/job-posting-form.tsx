import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldLabel } from "@/components/common/form-field";
import { RailCard } from "@/components/common/rail-card";
import type {
  CreateJobPostingRequest,
  JobPosting,
  UpdateJobPostingRequest,
} from "@/api/generated/types.gen";

import {
  DEFAULT_CURRENCY,
  JOB_EMPLOYMENT_TYPES,
  JOB_LEVELS,
  JOB_LIMITS,
  JOB_POSTINGS_PATH,
} from "./job-postings.constants";
import { JobPostingStatusBadge } from "./job-posting-status-badge";
import { toDeadlineDate } from "./job-postings.format";

type Translate = (key: string, options?: Record<string, unknown>) => string;

// Saving a job always publishes it (no Draft in Sprint 1), so every Published-field is required here.
function buildSchema(t: Translate, today: string, postingDeadline?: string) {
  const length = (min: number, max: number, key: string) =>
    z
      .string()
      .trim()
      .min(min, t(key, { min, max }))
      .max(max, t(key, { min, max }));
  return z
    .object({
      title: length(
        JOB_LIMITS.TITLE_MIN,
        JOB_LIMITS.TITLE_MAX,
        "jobPostings.validation.titleLength",
      ),
      location: length(
        JOB_LIMITS.LOCATION_MIN,
        JOB_LIMITS.LOCATION_MAX,
        "jobPostings.validation.locationLength",
      ),
      employmentType: z.enum(JOB_EMPLOYMENT_TYPES, {
        error: t("jobPostings.validation.employmentType"),
      }),
      level: z.string().trim().max(JOB_LIMITS.LEVEL_MAX),
      salaryMin: z.string(),
      salaryMax: z.string(),
      currency: z
        .string()
        .trim()
        .min(1, t("jobPostings.validation.currency"))
        .max(JOB_LIMITS.CURRENCY_MAX),
      openings: z.string(),
      expiresAt: z
        .string()
        .min(1, t("jobPostings.validation.deadlineRequired")),
      description: length(
        JOB_LIMITS.CONTENT_MIN,
        JOB_LIMITS.CONTENT_MAX,
        "jobPostings.validation.contentLength",
      ),
      requirements: length(
        JOB_LIMITS.CONTENT_MIN,
        JOB_LIMITS.CONTENT_MAX,
        "jobPostings.validation.contentLength",
      ),
      benefits: length(
        JOB_LIMITS.CONTENT_MIN,
        JOB_LIMITS.CONTENT_MAX,
        "jobPostings.validation.contentLength",
      ),
    })
    .superRefine((value, ctx) => {
      const min = value.salaryMin ? Number(value.salaryMin) : undefined;
      const max = value.salaryMax ? Number(value.salaryMax) : undefined;
      if (
        (min !== undefined && (!Number.isFinite(min) || min < 0)) ||
        (max !== undefined && (!Number.isFinite(max) || max < 0)) ||
        (min !== undefined && max !== undefined && min > max)
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("jobPostings.validation.salary"),
          path: ["salaryMin"],
        });
      }
      if (
        value.openings &&
        (!Number.isInteger(Number(value.openings)) ||
          Number(value.openings) < 1)
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("jobPostings.validation.openings"),
          path: ["openings"],
        });
      }
      // A deadline must be today or later; an existing one that already passed can stay as it is.
      if (
        value.expiresAt &&
        value.expiresAt !== postingDeadline &&
        value.expiresAt < today
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("jobPostings.validation.deadlinePast"),
          path: ["expiresAt"],
        });
      }
    });
}

type Values = Omit<
  z.infer<ReturnType<typeof buildSchema>>,
  "employmentType"
> & { employmentType: string };

const blank: Values = {
  title: "",
  location: "",
  employmentType: "",
  level: "",
  salaryMin: "",
  salaryMax: "",
  currency: DEFAULT_CURRENCY,
  openings: "",
  expiresAt: "",
  description: "",
  requirements: "",
  benefits: "",
};

function valuesFrom(posting?: JobPosting): Values {
  if (!posting) return blank;
  return {
    title: posting.title,
    location: posting.location ?? "",
    employmentType: posting.employmentType ?? "",
    level: posting.level ?? "",
    salaryMin: posting.salaryMin?.toString() ?? "",
    salaryMax: posting.salaryMax?.toString() ?? "",
    currency: posting.currency,
    openings: posting.openings?.toString() ?? "",
    expiresAt: posting.expiresAt ? toDeadlineDate(posting.expiresAt) : "",
    description: posting.description ?? "",
    requirements: posting.requirements ?? "",
    benefits: posting.benefits ?? "",
  };
}

function payloadFrom(values: Values): CreateJobPostingRequest {
  const optional = (value: string) => value.trim() || undefined;
  return {
    title: values.title.trim(),
    location: values.location.trim(),
    employment_type:
      values.employmentType as CreateJobPostingRequest["employment_type"],
    level: optional(values.level),
    salary_min: values.salaryMin ? Number(values.salaryMin) : undefined,
    salary_max: values.salaryMax ? Number(values.salaryMax) : undefined,
    currency: values.currency.trim(),
    openings: values.openings ? Number(values.openings) : undefined,
    expires_at: values.expiresAt,
    description: values.description.trim(),
    requirements: values.requirements.trim(),
    benefits: values.benefits.trim(),
  };
}

// Only the optional fields can be cleared (null); required ones are always sent.
function updatePayloadFrom(values: Values): UpdateJobPostingRequest {
  return {
    ...payloadFrom(values),
    level: values.level.trim() || null,
    salary_min: values.salaryMin ? Number(values.salaryMin) : null,
    salary_max: values.salaryMax ? Number(values.salaryMax) : null,
    openings: values.openings ? Number(values.openings) : null,
  };
}

/** Radix Select cannot hold an empty value, so "clear" is a sentinel that maps back to "". */
const NO_SELECTION = "__none__";
const controlClass = "h-[46px] rounded-xl border-border";
const sectionClass =
  "flex flex-col gap-[18px] rounded-2xl border border-border bg-card p-6";

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className={sectionClass}>
      <div className="flex flex-col gap-1">
        <h2 className="text-[16px] font-bold text-foreground">{title}</h2>
        <p className="m-0 text-[13px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function JobPostingForm({
  isSaving,
  onCreate,
  onUpdate,
  posting,
}: {
  isSaving: boolean;
  onCreate: (payload: CreateJobPostingRequest) => void;
  onUpdate: (payload: UpdateJobPostingRequest) => void;
  posting?: JobPosting;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [today] = useState(() => toDeadlineDate(Date.now()));
  const schema = buildSchema(
    t as Translate,
    today,
    posting?.expiresAt ? toDeadlineDate(posting.expiresAt) : undefined,
  );
  const form = useForm<Values>({
    defaultValues: valuesFrom(posting),
    resolver: zodResolver(schema) as never,
  });
  useEffect(() => form.reset(valuesFrom(posting)), [form, posting]);

  const errorOf = (name: keyof Values) => form.formState.errors[name]?.message;
  const label = (name: keyof Values, text: string, required: boolean) => (
    <FormFieldLabel className="mb-0" htmlFor={name} required={required}>
      {text}
      {required ? null : (
        <span className="ml-1 font-normal text-muted-foreground">
          ({t("jobPostings.optional")})
        </span>
      )}
    </FormFieldLabel>
  );
  const field = (
    name: keyof Values,
    text: string,
    options: {
      hint?: string;
      min?: string;
      multiline?: boolean;
      required?: boolean;
      type?: string;
    } = {},
  ) => (
    <div className="flex min-w-0 flex-col gap-2">
      {label(name, text, options.required ?? false)}
      {options.multiline ? (
        <Textarea
          aria-invalid={errorOf(name) ? true : undefined}
          className="rounded-xl border-border"
          id={name}
          rows={5}
          {...form.register(name)}
        />
      ) : (
        <Input
          aria-invalid={errorOf(name) ? true : undefined}
          className={controlClass}
          id={name}
          min={options.min}
          type={options.type ?? "text"}
          {...form.register(name)}
        />
      )}
      {errorOf(name) ? (
        <p
          className="text-[12.5px] leading-normal text-(--danger-fg)"
          role="alert"
        >
          {errorOf(name)}
        </p>
      ) : options.hint ? (
        <p className="text-[12.5px] leading-normal text-muted-foreground">
          {options.hint}
        </p>
      ) : null}
    </div>
  );
  const select = (
    name: "employmentType" | "level",
    text: string,
    required: boolean,
    placeholder: string,
    options: { label: string; value: string }[],
  ) => (
    <div className="flex min-w-0 flex-col gap-2">
      {label(name, text, required)}
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select
            onValueChange={(value) =>
              field.onChange(value === NO_SELECTION ? "" : value)
            }
            value={field.value || undefined}
          >
            <SelectTrigger
              aria-invalid={errorOf(name) ? true : undefined}
              className={`${controlClass} aria-invalid:border-destructive`}
              id={name}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {required ? null : (
                <SelectItem value={NO_SELECTION}>
                  {t("jobPostings.notSpecified")}
                </SelectItem>
              )}
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errorOf(name) ? (
        <p
          className="text-[12.5px] leading-normal text-(--danger-fg)"
          role="alert"
        >
          {errorOf(name)}
        </p>
      ) : null}
    </div>
  );
  const contentHint = t("jobPostings.contentHint", {
    min: JOB_LIMITS.CONTENT_MIN,
    max: JOB_LIMITS.CONTENT_MAX,
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) =>
        posting
          ? onUpdate(updatePayloadFrom(values))
          : onCreate(payloadFrom(values)),
      )}
    >
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-[18px]">
          <FormSection
            description={t("jobPostings.form.basicDescription")}
            title={t("jobPostings.basicInformation")}
          >
            <div className="grid gap-x-5 gap-y-[18px] md:grid-cols-2">
              {field("title", t("jobPostings.titleLabel"), { required: true })}
              {field("location", t("jobPostings.location"), { required: true })}
              {select(
                "employmentType",
                t("jobPostings.employmentType"),
                true,
                t("jobPostings.employmentTypePlaceholder"),
                JOB_EMPLOYMENT_TYPES.map((type) => ({
                  label: t(`jobPostings.employmentTypes.${type}`),
                  value: type,
                })),
              )}
              {select(
                "level",
                t("jobPostings.level"),
                false,
                t("jobPostings.level_placeholder"),
                [
                  ...JOB_LEVELS.map((level) => ({
                    label: level,
                    value: level,
                  })),
                  ...(posting?.level &&
                  !(JOB_LEVELS as readonly string[]).includes(posting.level)
                    ? [{ label: posting.level, value: posting.level }]
                    : []),
                ],
              )}
            </div>
          </FormSection>

          <FormSection
            description={t("jobPostings.form.compensationDescription")}
            title={t("jobPostings.compensation")}
          >
            <div className="grid gap-x-5 gap-y-[18px] md:grid-cols-2">
              {field("salaryMin", t("jobPostings.minimumSalary"), {
                min: "0",
                type: "number",
              })}
              {field("salaryMax", t("jobPostings.maximumSalary"), {
                min: "0",
                type: "number",
              })}
              {field("currency", t("jobPostings.currency"), { required: true })}
              {field("openings", t("jobPostings.openings"), {
                min: "1",
                type: "number",
              })}
            </div>
          </FormSection>

          <FormSection
            description={t("jobPostings.form.contentDescription")}
            title={t("jobPostings.content")}
          >
            <div className="grid gap-[18px]">
              {field("description", t("jobPostings.description"), {
                hint: contentHint,
                multiline: true,
                required: true,
              })}
              {field("requirements", t("jobPostings.requirements"), {
                hint: contentHint,
                multiline: true,
                required: true,
              })}
              {field("benefits", t("jobPostings.benefits"), {
                hint: contentHint,
                multiline: true,
                required: true,
              })}
            </div>
          </FormSection>

          <FormSection
            description={t("jobPostings.deadlineHint")}
            title={t("jobPostings.jobDetails")}
          >
            <div className="flex max-w-xs flex-col gap-2">
              {label("expiresAt", t("jobPostings.expiryDate"), true)}
              <Controller
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <DatePicker
                    aria-invalid={errorOf("expiresAt") ? true : undefined}
                    id="expiresAt"
                    min={today}
                    onChange={field.onChange}
                    today={today}
                    value={field.value}
                  />
                )}
              />
              {errorOf("expiresAt") ? (
                <p
                  className="text-[12.5px] leading-normal text-(--danger-fg)"
                  role="alert"
                >
                  {errorOf("expiresAt")}
                </p>
              ) : null}
            </div>
          </FormSection>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="h-11 rounded-xl px-5 text-sm font-semibold"
              onClick={() =>
                navigate(
                  posting
                    ? `${JOB_POSTINGS_PATH}/${posting.id}`
                    : JOB_POSTINGS_PATH,
                )
              }
              type="button"
              variant="outline"
            >
              {t("jobPostings.cancel")}
            </Button>
            <Button
              className="h-11 rounded-xl px-5 text-sm font-semibold"
              disabled={
                isSaving || (Boolean(posting) && !form.formState.isDirty)
              }
              type="submit"
            >
              {isSaving
                ? t("state.saving")
                : posting
                  ? t("jobPostings.save.action")
                  : t("jobPostings.create")}
            </Button>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {posting ? (
            <>
              <RailCard title={t("jobPostings.form.railNotEditableTitle")}>
                <p className="m-0 text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground">
                  {t("jobPostings.form.railNotEditableBody")}
                </p>
              </RailCard>
              <RailCard title={t("jobPostings.form.railCurrentStatus")}>
                <div>
                  <JobPostingStatusBadge posting={posting} />
                </div>
              </RailCard>
            </>
          ) : (
            <>
              <RailCard title={t("jobPostings.form.railSystemTitle")}>
                <p className="m-0 text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground">
                  <Trans
                    i18nKey="jobPostings.form.railSystemBody"
                    components={{
                      strong: <strong className="text-foreground" />,
                    }}
                  />
                </p>
              </RailCard>
            </>
          )}
        </aside>
      </div>
    </form>
  );
}
