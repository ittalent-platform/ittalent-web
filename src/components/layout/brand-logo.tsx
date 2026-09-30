import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/** Logo mark: a person whose arms arch like a bridge, white glyph on an Ember tile (DESIGN.md "Shapes"). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={cn("size-[34px] shrink-0", className)} fill="none" viewBox="0 0 40 40">
      <rect className="fill-brand" height="40" rx="11" width="40" />
      <circle cx="20" cy="10.4" fill="white" r="4.4" />
      <path d="M9 24 Q20 13.2 31 24" stroke="white" strokeLinecap="round" strokeWidth="5.4" />
      <rect fill="white" height="15" rx="2.7" width="5.4" x="17.3" y="19" />
    </svg>
  );
}

export function BrandLogo() {
  const { t } = useTranslation();
  return (
    <Link aria-label={t("nav.home")} className="flex shrink-0 items-center gap-2.5 text-foreground" to="/">
      <LogoMark />
      <span className="itt-display text-[19px] font-bold uppercase tracking-[0.04em]">{t("brand.wordmark")}</span>
    </Link>
  );
}
