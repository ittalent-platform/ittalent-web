import { ArrowUpRight, Server } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import {
  BACKEND_TECH,
  CAREER_PATH,
  FIELDS,
  SEARCH_PARAM,
  TONE_CLASSES,
} from "./home.constants";
import { useFieldCount } from "./home.queries";

const searchHref = (keyword: string) =>
  `${CAREER_PATH}?${SEARCH_PARAM}=${encodeURIComponent(keyword)}`;

function OpenJobs({ keyword }: { keyword: string }) {
  const { t } = useTranslation();
  const { data } = useFieldCount(keyword);
  return data === undefined ? (
    <>–</>
  ) : (
    <>{t("home.fields.openJobs", { count: data })}</>
  );
}

export function HomeFields() {
  const { t } = useTranslation();
  const backendKeyword = t("home.fields.backend.keyword");

  return (
    <section className="flex flex-col gap-7 px-4 py-[72px] md:px-12">
      <div className="flex items-end gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-mkt-accent-hover">
            {t("home.fields.eyebrow")}
          </span>
          <h2 className="itt-display text-[28px] font-semibold md:text-4xl">
            {t("home.fields.title")}
          </h2>
        </div>
        <div className="flex-1" />
        <Link
          className="text-[13.5px] font-semibold text-mkt-accent-hover hover:text-mkt-accent-dark"
          to={CAREER_PATH}
        >
          {t("home.fields.allJobs")} →
        </Link>
      </div>

      <div className="grid auto-rows-[190px] grid-cols-2 gap-4 lg:grid-cols-6">
        <Link
          className="relative col-span-2 row-span-2 flex flex-col justify-between overflow-hidden rounded-[20px] bg-mkt-ink p-7 text-white"
          to={searchHref(backendKeyword)}
        >
          <div className="absolute -bottom-[150px] -right-10 size-[300px] rounded-full bg-mkt-brand" />
          <div className="absolute -bottom-[100px] right-2.5 size-[200px] rounded-full border-2 border-white/35" />
          <div className="relative flex items-center">
            <span className="flex size-[52px] items-center justify-center rounded-2xl bg-white text-mkt-accent">
              <Server aria-hidden className="size-6" />
            </span>
            <span className="ml-2.5 flex h-[26px] items-center rounded-full bg-white/[0.12] px-3 text-[12px] font-semibold">
              {t("home.fields.mostJobs")}
            </span>
          </div>
          <div className="relative flex flex-col gap-3">
            <span className="itt-display text-[32px] font-semibold leading-[1.1]">
              {t("home.fields.backend.name")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BACKEND_TECH.map((tech) => (
                <span
                  className="flex h-[26px] items-center rounded-full bg-white/[0.12] px-2.5 text-[12px]"
                  key={tech}
                >
                  {tech}
                </span>
              ))}
            </div>
            <span className="text-sm font-semibold text-mkt-accent-border">
              <OpenJobs keyword={backendKeyword} /> →
            </span>
          </div>
        </Link>

        {FIELDS.map((field) => {
          const tone = TONE_CLASSES[field.tone];
          return (
            <Link
              className={cn(
                "relative flex flex-col justify-between overflow-hidden rounded-[20px] border p-[22px] text-mkt-ink",
                tone.card,
                field.wide && "col-span-2",
              )}
              key={field.id}
              to={searchHref(t(`home.fields.${field.id}.keyword`))}
            >
              <div className="flex items-center">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-[14px] bg-white",
                    tone.text,
                  )}
                >
                  <field.icon aria-hidden className="size-[22px]" />
                </span>
                <div className="flex-1" />
                <ArrowUpRight aria-hidden className={cn("size-5", tone.text)} />
              </div>
              <div className="flex flex-col gap-[3px]">
                <span className="itt-display text-[19px] font-semibold">
                  {t(`home.fields.${field.id}.name`)}
                </span>
                <span className="text-[12.5px] text-mkt-ink-2">
                  {t(`home.fields.${field.id}.hint`)}
                </span>
                <span className={cn("text-[13px] font-semibold", tone.text)}>
                  <OpenJobs keyword={t(`home.fields.${field.id}.keyword`)} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
