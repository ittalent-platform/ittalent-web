import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldLabel, FormFieldMessage } from "@/components/common/form-field";
import type {
  CreateJobPostingRequest,
  JobPosting,
  UpdateJobPostingRequest,
} from "@/api/generated/types.gen";
import { Breadcrumb } from "@/components/common/breadcrumb";

import {
  DEFAULT_CURRENCY,
  JOB_EMPLOYMENT_TYPES,
  JOB_LEVELS,
  JOB_LIMITS,
  JOB_POSTINGS_PATH,
} from "./job-postings.constants";
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
      title: length(JOB_LIMITS.TITLE_MIN, JOB_LIMITS.TITLE_MAX, "jobPostings.validation.titleLength"),
      location: length(JOB_LIMITS.LOCATION_MIN, JOB_LIMITS.LOCATION_MAX, "jobPostings.validation.locationLength"),
      employmentType: z.enum(JOB_EMPLOYMENT_TYPES, { error: t("jobPostings.validation.employmentType") }),
      level: z.string().trim().max(JOB_LIMITS.LEVEL_MAX),
      salaryMin: z.string(),
      salaryMax: z.string(),
      currency: z.string().trim().min(1, t("jobPostings.validation.currency")).max(JOB_LIMITS.CURRENCY_MAX),
      openings: z.string(),
      expiresAt: z.string().min(1, t("jobPostings.validation.deadlineRequired")),
      description: length(JOB_LIMITS.CONTENT_MIN, JOB_LIMITS.CONTENT_MAX, "jobPostings.validation.contentLength"),
      requirements: length(JOB_LIMITS.CONTENT_MIN, JOB_LIMITS.CONTENT_MAX, "jobPostings.validation.contentLength"),
      benefits: length(JOB_LIMITS.CONTENT_MIN, JOB_LIMITS.CONTENT_MAX, "jobPostings.validation.contentLength"),
    })
    .superRefine((value, ctx) => {
      const min = value.salaryMin ? Number(value.salaryMin) : undefined;
      const max = value.salaryMax ? Number(value.salaryMax) : undefined;
      if (
        (min !== undefined && (!Number.isFinite(min) || min < 0)) ||
        (max !== undefined && (!Number.isFinite(max) || max < 0)) ||
        (min !== undefined && max !== undefined && min > max)
      ) {
        ctx.addIssue({ code: "custom", message: t("jobPostings.validation.salary"), path: ["salaryMin"] });
      }
      if (value.openings && (!Number.isInteger(Number(value.openings)) || Number(value.openings) < 1)) {
        ctx.addIssue({ code: "custom", message: t("jobPostings.validation.openings"), path: ["openings"] });
      }
      // A deadline must be today or later; an existing one that already passed can stay as it is.
      if (value.expiresAt && value.expiresAt !== postingDeadline && value.expiresAt < today) {
        ctx.addIssue({ code: "custom", message: t("jobPostings.validation.deadlinePast"), path: ["expiresAt"] });
      }
    });
}

type Values = Omit<z.infer<ReturnType<typeof buildSchema>>, "employmentType"> & { employmentType: string };

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
    employment_type: values.employmentType as CreateJobPostingRequest["employment_type"],
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

const selectClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

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
  const schema = buildSchema(t as Translate, today, posting?.expiresAt ? toDeadlineDate(posting.expiresAt) : undefined);
  const form = useForm<Values>({
    defaultValues: valuesFrom(posting),
    resolver: zodResolver(schema) as never,
  });
  useEffect(() => form.reset(valuesFrom(posting)), [form, posting]);

  const label = (name: keyof Values, text: string, required: boolean) => (
    <FormFieldLabel htmlFor={name}>
      {text}{" "}
      {required ? (
        <span aria-hidden className="text-destructive">*</span>
      ) : (
        <span className="text-muted-foreground">({t("jobPostings.optional")})</span>
      )}
    </FormFieldLabel>
  );
  const error = (name: keyof Values) => (
    <FormFieldMessage error>{form.formState.errors[name]?.message}</FormFieldMessage>
  );
  const field = (
    name: keyof Values,
    text: string,
    options: { multiline?: boolean; required?: boolean; type?: string; hint?: string; min?: string } = {},
  ) => (
    <div className="space-y-1.5">
      {label(name, text, options.required ?? false)}
      {options.multiline ? (
        <Textarea id={name} {...form.register(name)} rows={5} />
      ) : (
        <Input id={name} min={options.min} type={options.type ?? "text"} {...form.register(name)} />
      )}
      {options.hint ? <p className="text-[12.5px] text-muted-foreground">{options.hint}</p> : null}
      {error(name)}
    </div>
  );
  const contentHint = t("jobPostings.contentHint", { min: JOB_LIMITS.CONTENT_MIN, max: JOB_LIMITS.CONTENT_MAX });

  return (
    <form
      className="grid gap-6"
      noValidate
      onSubmit={form.handleSubmit((values) => (posting ? onUpdate(updatePayloadFrom(values)) : onCreate(payloadFrom(values))))}
    >
      <Breadcrumb
        ariaLabel={t("jobPostings.title")}
        items={[
          { label: t("jobPostings.title"), to: JOB_POSTINGS_PATH },
          { label: posting ? t("jobPostings.editTitle") : t("jobPostings.createTitle") },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="itt-display text-xl font-semibold">{t("jobPostings.basicInformation")}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {field("title", t("jobPostings.titleLabel"), { required: true })}
              {field("location", t("jobPostings.location"), { required: true })}
              <div className="space-y-1.5">
                {label("employmentType", t("jobPostings.employmentType"), true)}
                <select className={selectClass} id="employmentType" {...form.register("employmentType")}>
                  <option value="">{t("jobPostings.employmentTypePlaceholder")}</option>
                  {JOB_EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`jobPostings.employmentTypes.${type}`)}
                    </option>
                  ))}
                </select>
                {error("employmentType")}
              </div>
              <div className="space-y-1.5">
                {label("level", t("jobPostings.level"), false)}
                <select className={selectClass} id="level" {...form.register("level")}>
                  <option value="">{t("jobPostings.level_placeholder")}</option>
                  {JOB_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                  {posting?.level && !(JOB_LEVELS as readonly string[]).includes(posting.level) ? (
                    <option value={posting.level}>{posting.level}</option>
                  ) : null}
                </select>
                {error("level")}
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="itt-display text-xl font-semibold">{t("jobPostings.compensation")}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {field("salaryMin", t("jobPostings.minimumSalary"), { type: "number", min: "0" })}
              {field("salaryMax", t("jobPostings.maximumSalary"), { type: "number", min: "0" })}
              {field("currency", t("jobPostings.currency"), { required: true })}
              {field("openings", t("jobPostings.openings"), { type: "number", min: "1" })}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="itt-display text-xl font-semibold">{t("jobPostings.content")}</h2>
            <div className="mt-5 grid gap-5">
              {field("description", t("jobPostings.description"), { multiline: true, required: true, hint: contentHint })}
              {field("requirements", t("jobPostings.requirements"), { multiline: true, required: true, hint: contentHint })}
              {field("benefits", t("jobPostings.benefits"), { multiline: true, required: true, hint: contentHint })}
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-6">
          <h2 className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{t("jobPostings.jobDetails")}</h2>
          <div className="mt-4">
            {field("expiresAt", t("jobPostings.expiryDate"), {
              type: "date",
              required: true,
              hint: t("jobPostings.deadlineHint"),
              min: posting ? undefined : today,
            })}
          </div>
        </aside>
      </div>
      <div className="flex justify-end gap-2 pt-5">
        <Button
          onClick={() => navigate(posting ? `${JOB_POSTINGS_PATH}/${posting.id}` : JOB_POSTINGS_PATH)}
          type="button"
          variant="outline"
        >
          {t("jobPostings.cancel")}
        </Button>
        <Button disabled={isSaving || (Boolean(posting) && !form.formState.isDirty)} type="submit">
          {isSaving ? t("state.saving") : posting ? t("jobPostings.save") : t("jobPostings.create")}
        </Button>
      </div>
    </form>
  );
}
