import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BrandLogo } from "@/components/layout/brand-logo";

/** Aside content shared by the candidate sign-in and sign-up screens. */
export function AuthHeroCopy() {
  const { t } = useTranslation();
  return (
    <>
      <BrandLogo tone="inverse" />

      <div className="mt-22 flex flex-col gap-4.5">
        <h2 className="m-0 font-['Space_Grotesk',sans-serif] text-[46px] font-semibold leading-[1.06] tracking-[-0.015em]">
          {t("auth.hero.title1")}
          <br />
          {t("auth.hero.title2")}
        </h2>

        <p className="m-0 max-w-[400px] text-[15.5px] leading-[1.6] text-white/90">{t("auth.hero.body")}</p>

        <div className="mt-1.5 text-sm">
          <Link
            className="font-semibold text-white underline underline-offset-4 decoration-white/50 hover:text-white"
            to="/employer"
          >
            {t("auth.hero.employers")}
          </Link>
        </div>
      </div>
    </>
  );
}
