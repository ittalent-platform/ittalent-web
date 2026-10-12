import { MapPin, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

import { MarketSelect } from "@/components/common/market-select";
import { hasUnsafeSearchText } from "@/lib/search-validation";
import { cn } from "@/lib/utils";

import { formatSalaryCard } from "@/features/public-site/career/career-format";
import {
  CAREER_PATH,
  HERO_FLOATER_COUNT,
  HERO_FLOATER_POSITIONS,
  HERO_TAGS,
  LOCATION_PARAM,
  POPULAR_SEARCHES,
  SEARCH_KEYWORD_MAX,
  SEARCH_PARAM,
  TONE_CLASSES,
} from "./home.constants";
import { CompanyMark } from "./company-mark";
import { useHomeData } from "./home.queries";

export function HomeHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useHomeData();
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");

  const floaters = data?.latestJobs.slice(0, HERO_FLOATER_COUNT) ?? [];
  const keywordError =
    keyword.length > SEARCH_KEYWORD_MAX
      ? t("home.search.keywordTooLong", { max: SEARCH_KEYWORD_MAX })
      : hasUnsafeSearchText(keyword)
        ? t("home.search.keywordUnsafe")
        : null;

  const goToJobs = (search: string, location = "") => {
    const params = new URLSearchParams();
    if (search.trim()) params.set(SEARCH_PARAM, search.trim());
    if (location) params.set(LOCATION_PARAM, location);
    const query = params.toString();
    navigate(query ? `${CAREER_PATH}?${query}` : CAREER_PATH);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!keywordError) goToJobs(keyword, city);
  };

  return (
    <section className="relative overflow-hidden bg-mkt-ink bg-[radial-gradient(rgba(255,255,255,0.10)_1.2px,transparent_1.2px)] bg-[size:26px_26px] px-4 pb-[116px] pt-12 text-white md:px-12 md:pt-[72px]">
      <div className="absolute -bottom-[330px] -left-[220px] size-[720px] rounded-full border-[1.5px] border-white/[0.09]" />
      <div className="absolute -bottom-[230px] -left-[120px] size-[520px] rounded-full border-[1.5px] border-white/[0.09]" />

      <div className="relative grid grid-cols-12 items-center gap-x-6">
        <div className="col-span-12 flex flex-col gap-6 min-[1360px]:col-span-7">
          <span className="flex h-[30px] items-center gap-2 self-start rounded-full border border-white/[0.14] bg-white/[0.08] px-3.5 text-[12.5px] font-semibold text-mkt-on-dark-soft">
            <span className="size-[7px] rounded-full bg-mkt-brand" />
            {t("home.hero.badge")}
          </span>

          <h1 className="itt-display text-[40px] font-semibold leading-[1.05] tracking-[-0.01em] md:text-[64px]">
            {t("home.hero.titleLine1")}
            <br />
            <span className="relative inline-block text-mkt-brand">
              {t("home.hero.titleLine2")}
              <svg
                aria-hidden="true"
                className="absolute -bottom-2.5 left-0"
                fill="none"
                height="14"
                preserveAspectRatio="none"
                viewBox="0 0 300 14"
                width="100%"
              >
                <path
                  d="M2 10 Q 150 -3 298 8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-1.5 max-w-[540px] text-[17px] leading-[1.6] text-mkt-on-dark">
            {t("home.hero.subtitle")}
          </p>

          <form
            aria-label={t("home.search.form")}
            className="mt-2 flex max-w-[720px] flex-wrap items-center gap-2 rounded-[28px] bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,0.25)] md:flex-nowrap md:rounded-full"
            onSubmit={onSubmit}
            role="search"
          >
            <label className="flex h-12 min-w-0 grow basis-full items-center gap-2.5 px-3.5 text-mkt-muted md:basis-auto">
              <Search aria-hidden className="size-[18px] shrink-0" />
              <span className="sr-only">{t("home.search.keyword")}</span>
              <input
                aria-invalid={keywordError ? true : undefined}
                className="min-w-0 grow border-0 bg-transparent text-[15px] text-mkt-ink outline-none placeholder:text-mkt-muted"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={t("home.search.keywordPlaceholder")}
                type="text"
                value={keyword}
              />
            </label>
            <div className="hidden h-7 w-px bg-mkt-line md:block" />
            <MarketSelect
              allLabel={t("home.search.allCities")}
              ariaLabel={t("home.search.city")}
              className="grow border-0 bg-transparent px-3 shadow-none md:w-[200px] md:grow-0"
              icon={<MapPin aria-hidden className="size-[18px]" />}
              onChange={setCity}
              options={(data?.cities ?? []).map((option) => ({ label: option, value: option }))}
              value={city}
            />
            <button
              className="flex h-12 items-center rounded-full bg-mkt-accent px-[26px] text-[14.5px] font-semibold text-white hover:bg-mkt-accent-hover disabled:opacity-60"
              disabled={Boolean(keywordError)}
              type="submit"
            >
              {t("home.search.submit")}
            </button>
          </form>
          {keywordError ? (
            <p className="text-[13px] text-mkt-on-dark-soft" role="alert">
              {keywordError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="mr-1 text-mkt-on-dark-muted">
              {t("home.hero.popular")}
            </span>
            {POPULAR_SEARCHES.map((item) => (
              <button
                className="flex h-[30px] items-center rounded-full border border-white/[0.18] px-3 text-mkt-on-dark-soft hover:border-white/40"
                key={item}
                onClick={() => goToJobs(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div
          aria-hidden
          className="relative col-span-5 hidden h-[480px] min-[1360px]:block"
        >
          {/* Fixed 546 x 480 artwork pinned to the right edge so its parts keep the design's proportions */}
          <div className="absolute right-0 top-0 h-[480px] w-[546px]">
            <svg
              className="absolute left-0 top-0"
              fill="none"
              height="480"
              viewBox="0 0 546 480"
              width="546"
            >
              <path
                d="M346 372 C 330 230, 300 130, 250 76"
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="5 6"
                strokeWidth="1.5"
              />
              <path
                d="M356 372 C 350 300, 330 245, 296 206"
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="5 6"
                strokeWidth="1.5"
              />
              <path
                d="M320 404 C 296 402, 282 394, 264 384"
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="5 6"
                strokeWidth="1.5"
              />
            </svg>
            <div className="absolute bottom-0 right-[30px] h-[430px] w-[340px] rounded-t-[170px] bg-mkt-brand" />
            <div className="absolute bottom-0 right-[70px] h-[350px] w-[260px] rounded-t-[130px] border-2 border-b-0 border-white/45" />
            <div className="absolute bottom-0 right-[110px] h-[270px] w-[180px] rounded-t-[90px] border-2 border-b-0 border-white/30" />
            <div className="absolute bottom-3 right-[30px] flex w-[340px] flex-col items-center gap-1.5">
              <div className="flex size-[72px] items-center justify-center rounded-full bg-white shadow-[0_10px_24px_rgba(25,25,28,0.25)]">
                <svg fill="none" height="36" viewBox="0 0 40 40" width="36">
                  <circle
                    cx="20"
                    cy="10.4"
                    fill="currentColor"
                    r="4.4"
                    className="text-mkt-accent"
                  />
                  <path
                    className="text-mkt-accent"
                    d="M9 24 Q20 13.2 31 24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="5.4"
                  />
                  <rect
                    className="text-mkt-accent"
                    fill="currentColor"
                    height="15"
                    rx="2.7"
                    width="5.4"
                    x="17.3"
                    y="19"
                  />
                </svg>
              </div>
              <span className="flex h-[26px] items-center rounded-full bg-mkt-ink px-3 text-[12px] font-semibold text-white">
                {t("home.hero.oneProfile")}
              </span>
            </div>

            {floaters.map((job, index) => (
              <Link
                className={cn(
                  "absolute flex h-[76px] w-[250px] items-center gap-3 rounded-2xl bg-white px-3.5 text-mkt-ink shadow-[0_10px_24px_rgba(0,0,0,0.3)]",
                  HERO_FLOATER_POSITIONS[index],
                )}
                key={job.id}
                tabIndex={-1}
                to={`${CAREER_PATH}/${job.slug || job.id}`}
              >
                <CompanyMark
                  className="size-10 rounded-xl text-sm"
                  name={job.companyName}
                  seed={job.enterpriseId}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[13.5px] font-semibold">
                    {job.title}
                  </span>
                  <span className="truncate text-[12px] text-mkt-muted">
                    {job.companyName} ·{" "}
                    {formatSalaryCard(
                      job.salaryMin,
                      job.salaryMax,
                      job.currency,
                    )}
                  </span>
                </span>
              </Link>
            ))}
            {HERO_TAGS.map((tag) => (
              <span
                className={cn(
                  "absolute flex h-[30px] items-center rounded-full px-3 text-[12.5px] font-semibold shadow-[0_6px_14px_rgba(0,0,0,0.25)]",
                  tag.position,
                  TONE_CLASSES[tag.tone].soft,
                  TONE_CLASSES[tag.tone].text,
                )}
                key={tag.label}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
