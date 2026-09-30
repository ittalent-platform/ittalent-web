import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import {
  EMPLOYERS_ANCHOR,
  LOGIN_PATH,
  REGISTER_PATH,
  STEP_NUMBERS,
} from "./home.constants";

type Side = "candidates" | "employers";

function Steps({ side, dark }: { side: Side; dark?: boolean }) {
  const { t } = useTranslation();
  return STEP_NUMBERS.map((n) => (
    <div className="relative flex gap-4" key={n}>
      <span
        className={cn(
          "itt-display flex size-[38px] shrink-0 items-center justify-center rounded-full text-[15px] font-bold",
          dark ? "bg-white/[0.12]" : "bg-mkt-accent text-white",
        )}
      >
        {n}
      </span>
      <div className="flex max-w-[420px] flex-col gap-1">
        <span className="text-base font-semibold">
          {t(`home.how.${side}.step${n}Title`)}
        </span>
        <span
          className={cn(
            "text-sm leading-[1.55]",
            dark ? "text-mkt-on-dark" : "text-mkt-ink-2",
          )}
        >
          {t(`home.how.${side}.step${n}Desc`)}
        </span>
      </div>
    </div>
  ));
}

export function HomeHowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-8 border-t border-mkt-line bg-mkt-canvas px-4 py-20 md:px-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-mkt-accent-hover">
          {t("home.how.eyebrow")}
        </span>
        <h2 className="itt-display text-[28px] font-semibold md:text-4xl">
          {t("home.how.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-6 rounded-3xl border border-mkt-accent-border bg-mkt-accent-tint p-6 md:p-9">
          <span className="flex h-7 items-center self-start rounded-full bg-mkt-accent-soft px-3.5 text-[12.5px] font-semibold text-mkt-accent-hover">
            {t("home.how.candidates.badge")}
          </span>
          <Steps side="candidates" />
          <Link
            className="mt-1.5 flex h-[46px] items-center self-start rounded-full bg-mkt-accent px-6 text-sm font-semibold text-white hover:bg-mkt-accent-hover"
            to={REGISTER_PATH}
          >
            {t("home.how.candidates.cta")}
          </Link>
        </div>

        <div
          className="relative flex scroll-mt-24 flex-col gap-6 overflow-hidden rounded-3xl bg-mkt-ink p-6 text-white md:p-9"
          id={EMPLOYERS_ANCHOR}
        >
          <div className="absolute -bottom-40 -right-[70px] size-[340px] rounded-full bg-mkt-brand" />
          <div className="absolute -bottom-[110px] -right-5 size-[240px] rounded-full border-2 border-white/35" />
          <span className="relative flex h-7 items-center self-start rounded-full bg-white/[0.12] px-3.5 text-[12.5px] font-semibold">
            {t("home.how.employers.badge")}
          </span>
          <Steps dark side="employers" />
          <Link
            className="relative mt-1.5 flex h-[46px] items-center self-start rounded-full bg-white px-6 text-sm font-semibold text-mkt-ink hover:bg-mkt-chip"
            to={LOGIN_PATH}
          >
            {t("home.how.employers.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
