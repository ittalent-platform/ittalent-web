import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type LogoTone = "brand" | "inverse";

/** Logo mark: a person whose arms arch like a bridge, white glyph on an Ember tile (DESIGN.md "Shapes"). */
export function LogoMark({ className, tone = "brand" }: { className?: string; tone?: LogoTone }) {
  const inverse = tone === "inverse";
  return (
    <svg aria-hidden className={cn("size-[34px] shrink-0", className)} fill="none" viewBox="0 0 40 40">
      <rect className={inverse ? "fill-white" : "fill-brand"} height="40" rx="11" width="40" />
      <circle cx="20" cy="10.4" className={inverse ? "fill-(--hero-candidate-bg)" : "fill-white"} r="4.4" />
      <path d="M9 24 Q20 13.2 31 24" className={inverse ? "stroke-(--hero-candidate-bg)" : "stroke-white"} strokeLinecap="round" strokeWidth="5.4" />
      <rect className={inverse ? "fill-(--hero-candidate-bg)" : "fill-white"} height="15" rx="2.7" width="5.4" x="17.3" y="19" />
    </svg>
  );
}

/** `inverse` is the white tile used on the Ember hero and the mobile auth header. */
export function BrandLogo({ onClick, tone = "brand", wordmarkClassName }: { onClick?: () => void; tone?: LogoTone; wordmarkClassName?: string }) {
  const { t } = useTranslation();
  return (
    <Link aria-label={t("nav.home")} className={cn("flex shrink-0 items-center gap-2.5", tone === "inverse" ? "text-white" : "text-foreground")} onClick={onClick} to="/">
      <LogoMark tone={tone} />
      <span className={cn("itt-display text-[19px] font-bold uppercase tracking-[0.04em]", wordmarkClassName)}>{t("brand.wordmark")}</span>
    </Link>
  );
}
