import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import { CompanyMark } from "./company-mark";
import { ENTERPRISES_PATH, TONE_CLASSES, TONES } from "./home.constants";
import { useHomeData, type HomeCompany } from "./home.queries";

/** Stable band colour per company. */
function toneFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONE_CLASSES[TONES[hash % TONES.length]!];
}

function CompanyCard({ company }: { company: HomeCompany }) {
  const { t } = useTranslation();
  const tone = toneFor(company.id);
  const subtitle = [company.industry, company.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      className="flex flex-col overflow-hidden rounded-[20px] border border-mkt-line bg-white text-mkt-ink"
      to={`${ENTERPRISES_PATH}/${company.id}`}
    >
      <div className={cn("relative h-[84px] overflow-hidden", tone.soft)}>
        <div className="absolute bottom-0 right-6 h-[62px] w-[120px] rounded-t-[60px] bg-mkt-ink/10" />
        <div className="absolute bottom-0 right-11 h-[42px] w-20 rounded-t-[40px] bg-mkt-ink/10" />
      </div>
      <div className="-mt-[30px] flex flex-col gap-3.5 px-[22px] pb-[22px]">
        <CompanyMark
          className="size-[60px] rounded-2xl border-4 border-white text-[17px]"
          name={company.name}
          seed={company.id}
        />
        <span className="flex flex-col gap-[3px]">
          <span className="itt-display text-[18px] font-semibold">
            {company.name}
          </span>
          {subtitle ? (
            <span className="text-[12.5px] text-mkt-muted">{subtitle}</span>
          ) : null}
        </span>
        {company.shortDescription ? (
          <p className="line-clamp-3 text-[13.5px] leading-[1.55] text-mkt-ink-2">
            {company.shortDescription}
          </p>
        ) : null}
        <div className="mt-auto flex items-center gap-2 border-t border-mkt-line-soft pt-3.5">
          <span className="flex h-6 items-center rounded-full bg-mkt-green-bg px-2.5 text-[12px] font-semibold text-mkt-green-fg">
            {t("home.companies.openJobs", { count: company.openJobs })}
          </span>
          {company.companySize ? (
            <span className="text-[12.5px] text-mkt-muted">
              {t("home.companies.size", { size: company.companySize })}
            </span>
          ) : null}
          <div className="flex-1" />
          <span className="text-[13px] font-semibold text-mkt-accent-hover">
            {t("home.companies.viewCompany")} →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HomeCompanies() {
  const { t } = useTranslation();
  const { data } = useHomeData();
  const companies = data?.topCompanies ?? [];
  if (companies.length === 0) return null;

  return (
    <section className="flex flex-col gap-7 px-4 py-20 md:px-12">
      <div className="flex items-end gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-mkt-accent-hover">
            {t("home.companies.eyebrow")}
          </span>
          <h2 className="itt-display text-[28px] font-semibold md:text-4xl">
            {t("home.companies.title")}
          </h2>
        </div>
        <div className="flex-1" />
        <Link
          className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-mkt-line-strong bg-white px-[18px] text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
          to={ENTERPRISES_PATH}
        >
          {t("home.companies.viewAll")}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <CompanyCard company={company} key={company.id} />
        ))}
      </div>
    </section>
  );
}
