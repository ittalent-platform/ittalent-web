import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export const WIZARD_BUTTON_CLASS = "h-12 min-w-[120px] rounded-xl px-5 text-[14px] font-semibold";
export const WIZARD_PRIMARY_BUTTON_CLASS = "h-12 min-w-[140px] rounded-xl px-6 text-[14.5px] font-semibold";

/** Footer of a wizard step, on the page background below the card: Back on the left, Save draft and the primary action on the right. */
export function WizardActions({
  children,
  onBack,
  onSaveDraft,
  saveDisabled,
}: {
  children: ReactNode;
  onBack?: () => void;
  onSaveDraft: () => void;
  saveDisabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between pt-1">
      {onBack ? (
        <Button className={WIZARD_BUTTON_CLASS} onClick={onBack} type="button" variant="outline">
          {t("enterpriseRegistration.common.back")}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        <Button className={WIZARD_BUTTON_CLASS} disabled={saveDisabled} onClick={onSaveDraft} type="button" variant="outline">
          {t("enterpriseRegistration.common.saveDraft")}
        </Button>
        {children}
      </div>
    </div>
  );
}
