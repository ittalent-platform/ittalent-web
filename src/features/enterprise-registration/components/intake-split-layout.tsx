import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BrandLogo } from "@/components/layout/brand-logo";

const EMPLOYER_HERO_ARCHES = [
  { d: "M-196 520 A476 476 0 0 1 756 520", color: "var(--hero-employer-ring-1)" },
  { d: "M-140 520 A420 420 0 0 1 700 520", color: "var(--hero-employer-ring-2)" },
  { d: "M-84 520 A364 364 0 0 1 644 520", color: "var(--hero-employer-ring-3)" },
  { d: "M-28 520 A308 308 0 0 1 588 520", color: "var(--hero-employer-ring-4)" },
  { d: "M28 520 A252 252 0 0 1 532 520", color: "var(--hero-employer-ring-5)" },
  { d: "M84 520 A196 196 0 0 1 476 520", color: "var(--hero-employer-ring-6)" },
  { d: "M140 520 A140 140 0 0 1 420 520", color: "var(--hero-employer-ring-7)" },
  { d: "M196 520 A84 84 0 0 1 364 520", color: "var(--hero-employer-ring-8)" },
  { d: "M252 520 A28 28 0 0 1 308 520", color: "var(--hero-employer-ring-9)" },
] as const;

export function IntakeSplitLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="relative hidden w-[560px] shrink-0 flex-col overflow-hidden bg-(--hero-bg) px-14 py-11 text-white lg:flex">
          {/* Concentric rings background SVG anchored at bottom center of aside */}
          <svg
            aria-hidden="true"
            width="560"
            height="520"
            viewBox="0 0 560 520"
            fill="none"
            className="pointer-events-none absolute bottom-0 left-0 block select-none"
          >
            <g className="itt-breathe">
              {EMPLOYER_HERO_ARCHES.map((arch) => (
                <path
                  key={arch.d}
                  d={arch.d}
                  stroke={arch.color}
                  strokeWidth="57"
                  strokeLinecap="butt"
                />
              ))}
            </g>
          </svg>

          {/* Foreground content stack */}
          <div className="relative z-10 flex flex-col">
            <BrandLogo tone="brand" wordmarkClassName="text-white" />

            {/* Copy block with 88px top offset matching mockup */}
            <div className="mt-[88px] flex flex-col gap-[18px]">
              <span className="self-start inline-flex h-[26px] items-center rounded-full bg-(--primary)/18 px-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-(--hero-employer-badge-fg)">
                {t("enterpriseRegistration.hero.badge")}
              </span>

              <h1 className="font-heading text-[46px] font-semibold leading-[1.06] tracking-[-0.015em] text-white">
                {t("auth.hero.employer.title1")}
                <br />
                {t("auth.hero.employer.title2")}
              </h1>

              <p className="max-w-[400px] text-[15.5px] leading-[1.6] text-(--hero-employer-desc)">
                {t("auth.hero.employer.body")}
              </p>

              {/* Candidate sign in CTA directly below hero copy */}
              <div className="mt-1.5 text-[14px]">
                <Link
                  to="/login"
                  className="font-semibold text-white underline underline-offset-4 decoration-white/40 transition-colors hover:text-white hover:decoration-white"
                >
                  {t("auth.hero.employer.candidate")}
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Top Header (Small Screens Only) */}
        <div className="flex items-center justify-between border-b border-border bg-(--hero-bg) px-6 py-4 text-white lg:hidden">
          <BrandLogo tone="brand" wordmarkClassName="text-white" />
          <Link
            to="/login"
            className="text-xs font-semibold text-white/90 underline underline-offset-2"
          >
            {t("enterpriseRegistration.hero.candidateShort")}
          </Link>
        </div>

        {/* Form view column */}
        <main className="flex min-h-screen flex-1 items-center justify-center overflow-y-auto bg-background p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-[440px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
