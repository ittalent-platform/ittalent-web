import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BrandLogo } from "@/components/layout/brand-logo";

import type { AuthHeroTone } from "./auth-hero.constants";

/** Aside content of the auth screens: candidate sign-in/sign-up, or the employer copy on invitation screens. */
export function AuthHeroCopy({ tone = "candidate" }: { tone?: AuthHeroTone }) {
  const { t } = useTranslation();
  const employer = tone === "employer";
  const key = (name: string) => (employer ? `auth.hero.employer.${name}` : `auth.hero.${name}`);
  return (
    <>
      <BrandLogo tone={employer ? "brand" : "inverse"} wordmarkClassName={employer ? "text-white" : undefined} />

      <div className="mt-22 flex flex-col gap-4.5">
        <h2 className="m-0 itt-display text-[46px] font-semibold leading-[1.06] tracking-[-0.015em]">
          {t(key("title1"))}
          <br />
          {t(key("title2"))}
        </h2>

        <p className="m-0 max-w-[400px] text-[15.5px] leading-[1.6] text-white/90">{t(key("body"))}</p>

        <div className="mt-1.5 text-sm">
          <Link
            className="font-semibold text-white underline underline-offset-4 decoration-white/50 hover:text-white"
            to={employer ? "/login" : "/employer"}
          >
            {t(employer ? "auth.hero.employer.candidate" : "auth.hero.employers")}
          </Link>
        </div>
      </div>
    </>
  );
}
