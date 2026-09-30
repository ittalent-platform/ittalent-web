import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { CAREER_PATH, REGISTER_PATH } from "./home.constants";

export function HomeCta() {
  const { t } = useTranslation();

  return (
    <section className="bg-white px-4 pb-[88px] pt-20 md:px-12">
      <div className="relative flex flex-col items-start gap-[18px] overflow-hidden rounded-[28px] bg-mkt-brand p-8 text-mkt-ink md:p-16">
        <div className="absolute -bottom-[260px] -right-20 size-[620px] rounded-full bg-mkt-ink/10" />
        <div className="absolute -bottom-[190px] right-[60px] size-[440px] rounded-full border-2 border-white/45" />
        <div className="absolute -bottom-[120px] right-[150px] size-[260px] rounded-full border-2 border-white/35" />
        <span className="relative text-[11px] font-bold uppercase tracking-[0.08em]">
          {t("home.cta.eyebrow")}
        </span>
        <h2 className="itt-display relative max-w-[620px] text-[36px] font-bold leading-[1.08] md:text-5xl">
          {t("home.cta.titleLine1")}
          <br />
          {t("home.cta.titleLine2")}
        </h2>
        <p className="relative max-w-[480px] text-base leading-[1.6]">
          {t("home.cta.body")}
        </p>
        <div className="relative flex flex-wrap gap-2.5 pt-2.5">
          <Link
            className="flex h-[50px] items-center rounded-full bg-mkt-ink px-7 text-[15px] font-semibold text-white hover:bg-black"
            to={REGISTER_PATH}
          >
            {t("home.cta.create")}
          </Link>
          <Link
            className="flex h-[50px] items-center rounded-full border-2 border-mkt-ink px-7 text-[15px] font-semibold text-mkt-ink hover:bg-mkt-ink/10"
            to={CAREER_PATH}
          >
            {t("home.cta.browse")}
          </Link>
        </div>
      </div>
    </section>
  );
}
