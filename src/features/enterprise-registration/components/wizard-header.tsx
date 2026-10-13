import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { PersonAvatar } from "@/components/common/person-avatar";
import { BrandLogo } from "@/components/layout/brand-logo";

const EXIT_CLASS =
  "ml-2 flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

interface WizardHeaderProps {
  representativeName?: string;
  corporateEmail?: string;
  isSaving?: boolean;
  onExit?: () => void;
}

export function WizardHeader({ representativeName, corporateEmail, isSaving = false, onExit }: WizardHeaderProps) {
  const { t } = useTranslation();
  const exitLabel = t("enterpriseRegistration.shell.exit");

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-border bg-card px-6 lg:px-12">
      <div className="flex items-center gap-4">
        <BrandLogo />
        <div aria-hidden="true" className="h-5 w-px bg-border" />
        <span className="text-[14px] font-medium text-foreground">{t("enterpriseRegistration.shell.title")}</span>
      </div>

      <div className="flex items-center gap-4">
        {isSaving ? <span className="hidden animate-pulse text-xs text-muted-foreground sm:inline">{t("enterpriseRegistration.shell.saving")}</span> : null}
        <div className="flex items-center gap-3">
          {representativeName || corporateEmail ? (
            <>
              <PersonAvatar className="size-10 text-sm" name={representativeName || corporateEmail} tone="peach" />
              <div className="hidden flex-col text-left sm:flex">
                <span className="text-[13px] font-semibold leading-tight text-foreground">{representativeName}</span>
                <span className="text-[11.5px] text-muted-foreground">{corporateEmail}</span>
              </div>
            </>
          ) : null}
          {onExit ? (
            <button aria-label={exitLabel} className={EXIT_CLASS} onClick={onExit} title={exitLabel} type="button">
              <LogOut aria-hidden className="size-4" />
            </button>
          ) : (
            <Link aria-label={exitLabel} className={EXIT_CLASS} title={exitLabel} to="/">
              <LogOut aria-hidden className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
