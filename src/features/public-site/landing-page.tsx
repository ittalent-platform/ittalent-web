import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import {
  hasUnsafeSearchText,
  INVALID_SEARCH_MESSAGE,
} from "@/lib/search-validation";

import { fetchJobs, type Job } from "./career/career.api";
import {
  companyInitials,
  EMPLOYMENT_LABELS,
  formatDeadline,
  formatSalaryCard,
  LEVEL_LABELS,
  logoPalette,
  postedAgo,
} from "./career/career-format";
import { fetchEnterpriseDirectory } from "./enterprise/enterprise.api";

const KEYWORD_MAX = 100;

const POPULAR = ["React", "Java", "DevOps", "QA Automation", "Data Engineer"];

const TAGS = [
  {
    className: "right-[150px] top-0",
    label: "React",
    bg: "#e4ecfb",
    fg: "#2a55a8",
  },
  {
    className: "right-5 top-[118px]",
    label: "Go",
    bg: "#e8f5ee",
    fg: "#12764a",
  },
  {
    className: "bottom-[30px] right-0",
    label: "DevOps",
    bg: "#efe9fb",
    fg: "#6941c6",
  },
  {
    className: "bottom-[150px] left-[30px]",
    label: "QA Automation",
    bg: "#fcf3e3",
    fg: "#b45309",
  },
];

const FLOATER_POSITIONS = [
  "left-0 top-9",
  "right-0 top-[168px]",
  "bottom-[60px] left-3.5",
];

const TINTS = {
  peach: { bg: "#fde8e0", fg: "#b33305", bd: "#f0b4a0" },
  blue: { bg: "#e4ecfb", fg: "#2a55a8", bd: "#c9d8f2" },
  violet: { bg: "#efe9fb", fg: "#6941c6", bd: "#d9ccf3" },
  green: { bg: "#e8f5ee", fg: "#12764a", bd: "#bce0cc" },
  amber: { bg: "#fcf3e3", fg: "#b45309", bd: "#f0d9ad" },
};

const ICON = {
  search: "M21 21l-4.34-4.34 M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0",
  pin: "M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0 M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
  arrowR: "M5 12h14 M12 5l7 7-7 7",
  briefcase:
    "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16 M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  building:
    "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4",
  clock: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0 M12 6v6l4 2",
  server: "M4 5h16v6H4z M4 13h16v6H4z M8 8h.01 M8 16h.01",
  up: "M7 17L17 7 M8 7h9v9",
};

type Category = {
  name: string;
  hint: string;
  /** The Jobs page searches job titles, so each field maps to one search word. */
  keyword: string;
  icon: string;
  tint: keyof typeof TINTS;
  wide?: boolean;
};

const CATEGORIES: Category[] = [
  {
    name: "Frontend",
    hint: "React, Vue, Angular",
    keyword: "frontend",
    icon: "M3 5h18v12H3z M8 21h8 M12 17v4",
    tint: "blue",
  },
  {
    name: "Mobile",
    hint: "iOS, Android, Flutter",
    keyword: "mobile",
    icon: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M12 18h.01",
    tint: "violet",
  },
  {
    name: "DevOps & Cloud",
    hint: "AWS, Kubernetes, CI/CD",
    keyword: "devops",
    icon: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",
    tint: "green",
  },
  {
    name: "QA & Testing",
    hint: "Automation, manual, performance",
    keyword: "qa",
    icon: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0 M9 12l2 2 4-4",
    tint: "amber",
  },
  {
    name: "Data & AI",
    hint: "Data engineering, ML, analytics",
    keyword: "data",
    icon: "M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3",
    tint: "peach",
    wide: true,
  },
  {
    name: "UI/UX Design",
    hint: "Product and interaction design",
    keyword: "design",
    icon: "M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.59 7.59 M9 11a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
    tint: "blue",
  },
  {
    name: "Product & BA",
    hint: "Product owners, analysts",
    keyword: "product",
    icon: ICON.briefcase,
    tint: "violet",
  },
];
const BACKEND = {
  name: "Backend",
  keyword: "backend",
  chips: ["Java", "Go", ".NET", "Node.js"],
};

const CAND_STEPS = [
  {
    n: "1",
    t: "Create one profile",
    d: "Sign up, verify your email and upload your CV as a PDF. It works for every company on ITTalent.",
  },
  {
    n: "2",
    t: "Search and apply",
    d: "Filter open roles by field, city, level and salary, then apply in a couple of clicks.",
  },
  {
    n: "3",
    t: "Track every application",
    d: "See each application move from Submitted to Under review, Interviewing and Offered.",
  },
];
const EMP_STEPS = [
  {
    n: "1",
    t: "Register your company",
    d: "Create a company account. Your profile goes public once the platform team approves it.",
  },
  {
    n: "2",
    t: "Publish jobs",
    d: "Post roles with a deadline. They appear on Jobs and on your company page while they are open.",
  },
  {
    n: "3",
    t: "Hire as a team",
    d: "Review applicants, schedule interviews and make offers with your hiring team.",
  },
];

function Icon({
  d,
  size = 18,
  className,
  stroke,
}: {
  d: string;
  size?: number;
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke={stroke ?? "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={d} />
    </svg>
  );
}

function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-[0.08em] text-mkt-accent-hover">
          {eyebrow}
        </span>
        <h2 className="m-0 font-['Space_Grotesk',sans-serif] text-[28px] font-semibold md:text-[36px]">
          {title}
        </h2>
      </div>
      <div className="flex-1" />
      {action}
    </div>
  );
}

const pillLink =
  "flex h-10 items-center gap-2 rounded-full border border-mkt-line-strong bg-white px-[18px] text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip";

const bodyPad = "mx-auto w-full max-w-[1440px] px-4 md:px-12";

export function LandingPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const keywordError =
    keyword.length > KEYWORD_MAX
      ? "Keep your search under 100 characters."
      : hasUnsafeSearchText(keyword)
        ? INVALID_SEARCH_MESSAGE
        : null;

  useEffect(() => {
    if (hash) {
      // Wait a frame so the section exists when arriving from another page.
      const id = decodeURIComponent(hash.slice(1));
      const raf = window.requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: "start" }),
      );
      return () => window.cancelAnimationFrame(raf);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [hash]);

  const { data: latest } = useQuery({
    queryKey: ["home-latest"],
    queryFn: () => fetchJobs({ page: 1, limit: 6, sort: "newest" }),
    staleTime: 60_000,
  });
  const { data: thisWeek } = useQuery({
    queryKey: ["home-week"],
    queryFn: () => fetchJobs({ page: 1, limit: 1, postedWithin: "7d" }),
    staleTime: 60_000,
  });
  const { data: directory } = useQuery({
    queryKey: ["enterprise-directory"],
    queryFn: fetchEnterpriseDirectory,
    staleTime: 60_000,
  });
  const fieldKeywords = [BACKEND.keyword, ...CATEGORIES.map((c) => c.keyword)];
  const fieldCounts = useQueries({
    queries: fieldKeywords.map((word) => ({
      queryKey: ["home-field", word],
      queryFn: () => fetchJobs({ page: 1, limit: 1, search: word }),
      staleTime: 60_000,
    })),
  });
  const countOf = (index: number) => fieldCounts[index]?.data?.total;

  const names = useMemo(() => {
    const map = new Map<string, NonNullable<typeof directory>[number]>();
    for (const e of directory ?? []) map.set(e.id, e);
    return map;
  }, [directory]);

  const cities = latest?.filters.locations ?? [];
  const totalJobs = latest?.total;
  const jobs = latest?.data ?? [];

  const topCompanies = useMemo(
    () =>
      [...(latest?.filters.enterprises ?? [])]
        .sort((a, b) => b.count - a.count)
        .map((o) => ({ entry: names.get(o.value), count: o.count }))
        .filter(
          (o): o is { entry: NonNullable<typeof o.entry>; count: number } =>
            Boolean(o.entry),
        )
        .slice(0, 6),
    [latest, names],
  );

  const stats = [
    {
      l: "open jobs you can apply to",
      v: totalJobs,
      icon: ICON.briefcase,
      ...TINTS.peach,
    },
    {
      l: "companies hiring now",
      v: latest?.filters.enterprises.length,
      icon: ICON.building,
      ...TINTS.blue,
    },
    {
      l: "new jobs this week",
      v: thisWeek?.total,
      icon: ICON.clock,
      ...TINTS.green,
    },
    {
      l: "cities across Vietnam",
      v: latest ? cities.length : undefined,
      icon: ICON.pin,
      ...TINTS.violet,
    },
  ];

  function goToJobs(search: string, location: string) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (location) params.set("location", location);
    const qs = params.toString();
    navigate(qs ? `/career?${qs}` : "/career");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (keywordError) return;
    goToJobs(keyword, city);
  }

  const backendCount = countOf(0);
  const otherCounts = CATEGORIES.map((_, i) => countOf(i + 1) ?? 0);
  const backendIsMost =
    backendCount !== undefined &&
    otherCounts.every((n) => backendCount >= n) &&
    backendCount > 0;

  const floaters = jobs.slice(0, 3);

  return (
    <main className="flex flex-col bg-white">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-mkt-ink bg-[radial-gradient(rgba(255,255,255,0.10)_1.2px,transparent_1.2px)] [background-size:26px_26px] px-4 pb-32 pt-14 text-white md:px-12 md:pb-[116px] md:pt-[72px]"
        id="page-hero"
      >
        <div className="absolute -bottom-[330px] -left-[220px] size-[720px] rounded-full border-[1.5px] border-white/[0.09]" />
        <div className="absolute -bottom-[230px] -left-[120px] size-[520px] rounded-full border-[1.5px] border-white/[0.09]" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-x-6 xl:grid-cols-12">
          <div className="flex flex-col gap-6 xl:col-span-7">
            <span className="flex h-[30px] items-center gap-2 self-start rounded-full border border-white/[0.14] bg-white/[0.08] px-3.5 text-[12.5px] font-semibold text-mkt-on-dark-soft">
              <span className="size-[7px] rounded-full bg-mkt-brand" />
              IT jobs from companies across Vietnam
            </span>
            <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[42px] font-semibold leading-[1.05] tracking-[-0.01em] md:text-[64px]">
              Where IT careers
              <br />
              <span className="relative inline-block text-mkt-brand">
                take shape.
                <svg
                  aria-hidden="true"
                  className="absolute bottom-[-10px] left-0"
                  height="14"
                  preserveAspectRatio="none"
                  viewBox="0 0 300 14"
                  width="100%"
                >
                  <path
                    d="M2 10 Q 150 -3 298 8"
                    fill="none"
                    stroke="#f2470c"
                    strokeLinecap="round"
                    strokeWidth="4"
                  />
                </svg>
              </span>
            </h1>
            <p className="m-0 mt-1.5 max-w-[540px] text-[17px] leading-[1.6] text-mkt-on-dark">
              Search open roles from every hiring company on ITTalent. Keep one
              profile and CV, and apply to any of them.
            </p>

            <div className="mt-2 flex max-w-[720px] flex-col gap-1.5">
              <form
                aria-label="Search jobs"
                className="flex flex-col gap-2 rounded-3xl bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,0.25)] sm:flex-row sm:items-center sm:rounded-full"
                onSubmit={onSubmit}
                role="search"
              >
                <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 px-3.5 text-mkt-muted">
                  <Icon d={ICON.search} />
                  <span className="sr-only">Keyword</span>
                  <input
                    aria-invalid={keywordError ? true : undefined}
                    className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-mkt-ink outline-none placeholder:text-mkt-muted"
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Job title, skill or company"
                    type="text"
                    value={keyword}
                  />
                </label>
                <div className="hidden h-7 w-px bg-mkt-line sm:block" />
                <label className="flex h-12 items-center gap-2 px-3 text-sm text-mkt-muted">
                  <Icon d={ICON.pin} />
                  <span className="sr-only">City</span>
                  <select
                    className="w-full border-0 bg-transparent text-[14.5px] text-mkt-ink outline-none sm:w-[150px]"
                    onChange={(e) => setCity(e.target.value)}
                    value={city}
                  >
                    <option value="">All cities</option>
                    {cities.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.value}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-mkt-accent px-[26px] text-[14.5px] font-semibold text-white hover:bg-mkt-accent-hover"
                  type="submit"
                >
                  Search jobs
                </button>
              </form>
              {keywordError ? (
                <p className="m-0 pl-4 text-xs text-[#ffb4a8]" role="alert">
                  {keywordError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="mr-1 text-mkt-on-dark-muted">Popular:</span>
              {POPULAR.map((p) => (
                <Link
                  className="flex h-[30px] items-center rounded-full border border-white/[0.18] px-3 text-mkt-on-dark-soft hover:bg-white/10"
                  key={p}
                  to={`/career?search=${encodeURIComponent(p)}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative hidden h-[480px] xl:col-span-5 xl:block">
            <svg
              aria-hidden="true"
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
            <div className="absolute bottom-0 right-[70px] box-border h-[350px] w-[260px] rounded-t-[130px] border-2 border-b-0 border-white/45" />
            <div className="absolute bottom-0 right-[110px] box-border h-[270px] w-[180px] rounded-t-[90px] border-2 border-b-0 border-white/30" />
            <div className="absolute bottom-11 left-[310px] flex size-[72px] items-center justify-center rounded-full bg-white shadow-[0_10px_24px_rgba(25,25,28,0.25)]">
              <svg
                aria-hidden="true"
                height="36"
                viewBox="0 0 32 32"
                width="36"
              >
                <circle cx="16" cy="10" fill="#d73c03" r="3.6" />
                <path
                  d="M7 25c1.6-6.2 4.8-9.4 9-9.4s7.4 3.2 9 9.4"
                  fill="none"
                  stroke="#d73c03"
                  strokeLinecap="round"
                  strokeWidth="2.8"
                />
              </svg>
            </div>
            <span className="absolute bottom-3 left-[292px] flex h-[26px] items-center rounded-full bg-mkt-ink px-3 text-xs font-semibold text-white">
              One profile, one CV
            </span>

            {floaters.map((job, i) => {
              const company = job.enterpriseId
                ? names.get(job.enterpriseId)
                : undefined;
              const palette = logoPalette(job.enterpriseId ?? company?.name);
              return (
                <Link
                  className={cn(
                    "absolute box-border flex h-[76px] w-[250px] items-center gap-3 rounded-2xl bg-white px-3.5 text-mkt-ink shadow-[0_10px_24px_rgba(0,0,0,0.3)]",
                    FLOATER_POSITIONS[i],
                  )}
                  key={job._id}
                  to={`/career/${job.slug}`}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl font-['Space_Grotesk',sans-serif] text-sm font-bold"
                    style={{ background: palette.bg, color: palette.fg }}
                  >
                    {companyInitials(company?.name)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[13.5px] font-semibold">
                      {job.title}
                    </span>
                    <span className="truncate text-xs text-mkt-muted">
                      {[
                        company?.name,
                        formatSalaryCard(
                          job.salary_min,
                          job.salary_max,
                          job.currency,
                        ).replace(/ VND \/ mo$/, ""),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              );
            })}
            {TAGS.map((t) => (
              <span
                className={cn(
                  "absolute flex h-[30px] items-center rounded-full px-3 text-[12.5px] font-semibold shadow-[0_6px_14px_rgba(0,0,0,0.25)]",
                  t.className,
                )}
                key={t.label}
                style={{ background: t.bg, color: t.fg }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        aria-label="Marketplace at a glance"
        className="relative z-[2] mx-4 -mt-[60px] grid grid-cols-1 gap-y-5 rounded-[20px] border border-mkt-line bg-white px-2 py-[26px] shadow-[0_10px_24px_rgba(25,25,28,0.1)] sm:grid-cols-2 lg:grid-cols-4 md:mx-12 min-[1440px]:mx-auto min-[1440px]:w-[calc(100%-96px)] min-[1440px]:max-w-[1344px]"
      >
        {stats.map((s, i) => (
          <div
            className={cn(
              "flex items-center gap-4 px-7",
              i > 0 && "lg:border-l lg:border-mkt-line-soft",
              i === 2 && "sm:max-lg:border-t-0",
            )}
            key={s.l}
          >
            <span
              className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl"
              style={{ background: s.bg, color: s.fg }}
            >
              <Icon d={s.icon} size={24} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-['Space_Grotesk',sans-serif] text-[28px] font-bold leading-[1.1]">
                {s.v ?? "—"}
              </span>
              <span className="text-[13px] text-mkt-ink-2">{s.l}</span>
            </span>
          </div>
        ))}
      </section>

      {/* Browse by field */}
      <section
        className={cn(bodyPad, "flex flex-col gap-7 pb-[72px] pt-[72px]")}
      >
        <SectionHead
          action={
            <Link
              className="text-[13.5px] font-semibold hover:text-mkt-accent-hover"
              to="/career"
            >
              All jobs →
            </Link>
          }
          eyebrow="BROWSE BY FIELD"
          title="Find your kind of work"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[190px] lg:grid-cols-6">
          <Link
            className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[20px] bg-mkt-ink p-7 text-white sm:col-span-2 lg:col-span-2 lg:row-span-2"
            to={`/career?search=${BACKEND.keyword}`}
          >
            <div className="absolute -bottom-[150px] -right-10 size-[300px] rounded-full bg-mkt-brand" />
            <div className="absolute -bottom-[100px] right-2.5 size-[200px] rounded-full border-2 border-white/35" />
            <div className="relative flex items-center">
              <span className="flex size-[52px] items-center justify-center rounded-2xl bg-white text-mkt-accent">
                <Icon d={ICON.server} size={24} />
              </span>
              {backendIsMost ? (
                <span className="ml-2.5 flex h-[26px] items-center rounded-full bg-white/[0.12] px-3 text-xs font-semibold">
                  Most jobs
                </span>
              ) : null}
            </div>
            <div className="relative flex flex-col gap-3">
              <span className="font-['Space_Grotesk',sans-serif] text-[32px] font-semibold leading-[1.1]">
                {BACKEND.name}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {BACKEND.chips.map((c) => (
                  <span
                    className="flex h-[26px] items-center rounded-full bg-white/[0.12] px-2.5 text-xs"
                    key={c}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <span className="text-sm font-semibold text-mkt-accent-border">
                {backendCount ?? "—"} open jobs →
              </span>
            </div>
          </Link>

          {CATEGORIES.map((c, i) => {
            const t = TINTS[c.tint];
            return (
              <Link
                className={cn(
                  "relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-[20px] border p-[22px] text-mkt-ink",
                  c.wide && "sm:col-span-2",
                )}
                key={c.name}
                style={{ background: t.bg, borderColor: t.bd }}
                to={`/career?search=${c.keyword}`}
              >
                <div className="flex items-center">
                  <span
                    className="flex size-11 items-center justify-center rounded-[14px] bg-white"
                    style={{ color: t.fg }}
                  >
                    <Icon d={c.icon} size={22} />
                  </span>
                  <div className="flex-1" />
                  <Icon d={ICON.up} size={20} stroke={t.fg} />
                </div>
                <div className="flex flex-col gap-[3px]">
                  <span className="font-['Space_Grotesk',sans-serif] text-[19px] font-semibold">
                    {c.name}
                  </span>
                  <span className="text-[12.5px] text-mkt-ink-2">{c.hint}</span>
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: t.fg }}
                  >
                    {countOf(i + 1) ?? "—"} open jobs
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Latest jobs */}
      <section className="border-y border-mkt-line bg-mkt-canvas">
        <div className={cn(bodyPad, "flex flex-col gap-7 py-[72px]")}>
          <SectionHead
            action={
              <Link className={pillLink} to="/career">
                View all jobs
                <Icon d={ICON.arrowR} size={16} />
              </Link>
            }
            eyebrow="LATEST JOBS"
            title="Open roles, newest first"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <HomeJobCard
                company={
                  job.enterpriseId ? names.get(job.enterpriseId) : undefined
                }
                job={job}
                key={job._id}
                onOpen={() => navigate(`/career/${job.slug}`)}
              />
            ))}
          </div>
          {latest && jobs.length === 0 ? (
            <p className="m-0 text-sm text-mkt-ink-2">
              There are no open jobs right now. Please check back soon.
            </p>
          ) : null}
        </div>
      </section>

      {/* Top companies */}
      {topCompanies.length > 0 ? (
        <section className={cn(bodyPad, "flex flex-col gap-7 py-20")}>
          <SectionHead
            action={
              <Link className={pillLink} to="/enterprises">
                View all companies
                <Icon d={ICON.arrowR} size={16} />
              </Link>
            }
            eyebrow="TOP COMPANIES HIRING"
            title="Meet the teams behind the jobs"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topCompanies.map(({ entry, count }) => {
              const palette = logoPalette(entry.id);
              const meta = [entry.industry, entry.location]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  className="flex flex-col overflow-hidden rounded-[20px] border border-mkt-line bg-white text-mkt-ink hover:border-mkt-line-strong"
                  key={entry.id}
                  to={`/enterprises/${entry.id}`}
                >
                  <div
                    className="relative h-[84px] overflow-hidden"
                    style={{ background: palette.bg }}
                  >
                    <div
                      className="absolute bottom-0 right-6 h-[62px] w-[120px] rounded-t-[60px]"
                      style={{ background: `${palette.fg}26` }}
                    />
                    <div
                      className="absolute bottom-0 right-11 h-[42px] w-20 rounded-t-[40px]"
                      style={{ background: `${palette.fg}26` }}
                    />
                  </div>
                  <div className="relative -mt-[30px] flex flex-col gap-3.5 px-[22px] pb-[22px]">
                    <span
                      aria-hidden="true"
                      className="box-border flex size-[60px] items-center justify-center rounded-2xl border-4 border-white font-['Space_Grotesk',sans-serif] text-[17px] font-bold"
                      style={{ background: palette.bg, color: palette.fg }}
                    >
                      {companyInitials(entry.name)}
                    </span>
                    <span className="flex flex-col gap-[3px]">
                      <span className="font-['Space_Grotesk',sans-serif] text-lg font-semibold">
                        {entry.name}
                      </span>
                      {meta ? (
                        <span className="text-[12.5px] text-mkt-muted">
                          {meta}
                        </span>
                      ) : null}
                    </span>
                    {entry.shortDescription ? (
                      <p className="m-0 line-clamp-3 text-[13.5px] leading-[1.55] text-mkt-ink-2">
                        {entry.shortDescription}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-2 border-t border-mkt-line-soft pt-3.5">
                      <span className="flex h-6 items-center rounded-full bg-mkt-green-bg px-2.5 text-xs font-semibold text-mkt-green-fg">
                        {count} open job{count === 1 ? "" : "s"}
                      </span>
                      <div className="flex-1" />
                      <span className="text-[13px] font-semibold text-mkt-accent-hover">
                        View company →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section className="border-t border-mkt-line bg-mkt-canvas">
        <div className={cn(bodyPad, "flex flex-col gap-8 py-20")}>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-[11px] font-bold tracking-[0.08em] text-mkt-accent-hover">
              HOW ITTALENT WORKS
            </span>
            <h2 className="m-0 font-['Space_Grotesk',sans-serif] text-[28px] font-semibold md:text-[36px]">
              One platform, two sides of hiring
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-6 rounded-3xl border border-mkt-accent-border bg-mkt-accent-tint p-6 md:p-9">
              <span className="flex h-7 items-center self-start rounded-full bg-mkt-accent-soft px-3.5 text-[12.5px] font-semibold text-mkt-accent-hover">
                For candidates
              </span>
              {CAND_STEPS.map((s) => (
                <div className="flex gap-4" key={s.n}>
                  <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-mkt-accent font-['Space_Grotesk',sans-serif] text-[15px] font-bold text-white">
                    {s.n}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold">{s.t}</span>
                    <span className="text-sm leading-[1.55] text-mkt-ink-2">
                      {s.d}
                    </span>
                  </div>
                </div>
              ))}
              <Link
                className="mt-1.5 flex h-[46px] items-center self-start rounded-full bg-mkt-accent px-6 text-sm font-semibold text-white hover:bg-mkt-accent-hover"
                to="/register"
              >
                Create your profile
              </Link>
            </div>

            <div
              className="relative flex scroll-mt-4 flex-col gap-6 overflow-hidden rounded-3xl bg-mkt-ink p-6 text-white md:p-9"
              id="employers"
            >
              <div className="absolute -bottom-40 -right-[70px] size-[340px] rounded-full bg-mkt-brand" />
              <div className="absolute -bottom-[110px] -right-5 size-[240px] rounded-full border-2 border-white/35" />
              <span className="relative flex h-7 items-center self-start rounded-full bg-white/[0.12] px-3.5 text-[12.5px] font-semibold">
                For employers
              </span>
              {EMP_STEPS.map((s) => (
                <div className="relative flex gap-4" key={s.n}>
                  <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-white/[0.12] font-['Space_Grotesk',sans-serif] text-[15px] font-bold">
                    {s.n}
                  </span>
                  <div className="flex max-w-[420px] flex-col gap-1">
                    <span className="text-base font-semibold">{s.t}</span>
                    <span className="text-sm leading-[1.55] text-mkt-on-dark">
                      {s.d}
                    </span>
                  </div>
                </div>
              ))}
              <Link
                className="relative mt-1.5 flex h-[46px] items-center self-start rounded-full bg-white px-6 text-sm font-semibold text-mkt-ink hover:bg-mkt-chip"
                to="/register"
              >
                Register your company
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={cn(bodyPad, "pb-[88px] pt-20")}>
        <div className="relative flex flex-col items-start gap-[18px] overflow-hidden rounded-[28px] bg-mkt-brand p-8 text-mkt-ink md:p-16">
          <div className="absolute -bottom-[260px] -right-20 size-[620px] rounded-full bg-mkt-ink/10" />
          <div className="absolute -bottom-[190px] right-[60px] size-[440px] rounded-full border-2 border-white/45" />
          <div className="absolute -bottom-[120px] right-[150px] size-[260px] rounded-full border-2 border-white/35" />
          <span className="relative text-[11px] font-bold tracking-[0.08em]">
            START TODAY
          </span>
          <h2 className="relative m-0 max-w-[620px] font-['Space_Grotesk',sans-serif] text-[34px] font-bold leading-[1.08] md:text-5xl">
            One profile.
            <br />
            Every company.
          </h2>
          <p className="relative m-0 max-w-[480px] text-base leading-[1.6]">
            Create your ITTalent profile once, upload your CV, and apply to IT
            roles across Vietnam in a couple of clicks.
          </p>
          <div className="relative flex flex-wrap gap-2.5 pt-2.5">
            <Link
              className="flex h-[50px] items-center rounded-full bg-mkt-ink px-7 text-[15px] font-semibold text-white hover:bg-black"
              to="/register"
            >
              Create your profile
            </Link>
            <Link
              className="flex h-[50px] items-center rounded-full border-2 border-mkt-ink px-7 text-[15px] font-semibold text-mkt-ink hover:bg-mkt-ink/10"
              to="/career"
            >
              Browse jobs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeJobCard({
  job,
  company,
  onOpen,
}: {
  job: Job;
  company?: { id: string; name: string };
  onOpen: () => void;
}) {
  const palette = logoPalette(job.enterpriseId ?? company?.name);
  const type = job.employment_type
    ? (EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type)
    : null;
  const level = job.level
    ? (LEVEL_LABELS[job.level.toLowerCase()] ?? job.level)
    : null;
  const posted = postedAgo(job.createdAt);
  const deadline = formatDeadline(job.expires_at);
  const when = [
    posted ? `Posted ${posted}` : null,
    deadline ? `Apply by ${deadline}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="flex cursor-pointer flex-col gap-3.5 rounded-2xl border border-mkt-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-mkt-line-strong"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl font-['Space_Grotesk',sans-serif] text-[15px] font-bold"
          style={{ background: palette.bg, color: palette.fg }}
        >
          {companyInitials(company?.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {company ? (
            <Link
              className="truncate text-[13.5px] font-semibold text-mkt-ink hover:text-mkt-accent-hover"
              onClick={(e) => e.stopPropagation()}
              to={`/enterprises/${company.id}`}
            >
              {company.name}
            </Link>
          ) : null}
          {job.location ? (
            <span className="text-[12.5px] text-mkt-muted">{job.location}</span>
          ) : null}
        </span>
      </div>
      <Link
        className="font-['Space_Grotesk',sans-serif] text-lg font-semibold leading-[1.3] text-mkt-ink hover:text-mkt-accent-hover"
        onClick={(e) => e.stopPropagation()}
        to={`/career/${job.slug}`}
      >
        {job.title}
      </Link>
      {type || level ? (
        <div className="flex flex-wrap gap-1.5">
          {type ? (
            <span className="flex h-6 items-center rounded-full bg-mkt-chip px-2.5 text-xs font-semibold text-mkt-ink-2">
              {type}
            </span>
          ) : null}
          {level ? (
            <span className="flex h-6 items-center rounded-full bg-mkt-chip px-2.5 text-xs font-semibold text-mkt-ink-2">
              {level}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex-1" />
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-mkt-line-soft pt-3.5">
        <span className="text-sm font-semibold text-mkt-ink">
          {formatSalaryCard(job.salary_min, job.salary_max, job.currency)}
        </span>
        <div className="flex-1" />
        {when ? <span className="text-xs text-mkt-subtle">{when}</span> : null}
      </div>
    </article>
  );
}