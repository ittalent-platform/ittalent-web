import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AUTH_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import { Button } from "@/components/ui/button";

/** Footer row of a wizard step: Back on the left, the step's primary action (children) on the right. */
export function StepActions({ backDisabled, children, onBack }: { backDisabled?: boolean; children: ReactNode; onBack?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line-muted pt-6">
      {onBack ? (
        <Button className={AUTH_ACTION_CLASS} disabled={backDisabled} onClick={onBack} shape="xl" type="button" variant="outline">
          <ArrowLeft aria-hidden />
          {t("enterpriseRegistration.common.back")}
        </Button>
      ) : (
        <span />
      )}
      {children}
    </div>
  );
}
